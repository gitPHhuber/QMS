#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Собирает "ядро" проекта в один текстовый файл, начиная с директории,
из которой был запущен скрипт (текущий рабочий каталог).

Рекурсивно проходит по подкаталогам, игнорируя мусорные директории и бинарники.
Собирает:
- фронтовый код (ts/tsx/js/jsx/css/html/md/json/jsonc)
- Ansible playbooks (yml/yaml)
- bash-скрипты (sh)
- Python-скрипты (py)
- Terraform (tf, tfvars)
- lock-файлы (*.lock) и cfg-конфиги (*.cfg)

Если дамп уже существует, создаёт следующий файл с версией:
project_dump_core.txt, project_dump_core_2.txt, project_dump_core_3.txt, ...

НОВОЕ:
- При дампе может удалять комментарии (чтобы экономить контекст),
  не меняя исходные файлы проекта.
"""

from __future__ import annotations

import io
import os
import tokenize
from pathlib import Path


# === Настройки под проект ===
PROJECT_DIR = Path.cwd().resolve()

DUMP_BASENAME_PREFIX = "project_dump_core"
DUMP_EXTENSION = ".txt"

# === Сжатие контекста: удаление комментариев при дампе ===
# Если True — перед записью в дамп вырезаем комментарии (исходники не трогаем).
STRIP_COMMENTS_IN_DUMP = True
# Если True — НЕ удаляем docstring в Python ("""..."""/'''...''')
KEEP_PY_DOCSTRINGS = False


def get_next_output_file(project_dir: Path) -> Path:
    """
    Возвращает путь к следующему файлу дампа.
    """
    base_file = project_dir / f"{DUMP_BASENAME_PREFIX}{DUMP_EXTENSION}"
    if not base_file.exists():
        return base_file

    max_version = 1  # базовый файл считаем версией 1

    for p in project_dir.glob(f"{DUMP_BASENAME_PREFIX}_*{DUMP_EXTENSION}"):
        stem = p.stem
        parts = stem.split("_")
        if not parts:
            continue
        last = parts[-1]
        try:
            num = int(last)
        except ValueError:
            continue
        if num > max_version:
            max_version = num

    next_version = max_version + 1
    return project_dir / f"{DUMP_BASENAME_PREFIX}_{next_version}{DUMP_EXTENSION}"


# Какие корневые файлы нужны (точные имена)
ALLOWED_ROOT_FILES = {
    "README.md",
    "index.html",
    "package.json",
    "eslint.config.js",
    "vite.config.ts",
    "tsconfig.json",
    "tsconfig.app.json",
    "tsconfig.node.json",
}

# Разрешённые расширения исходников и скриптов
ALLOWED_EXT = {
    # фронт
    ".ts", ".tsx", ".js", ".jsx", ".css", ".md", ".json", ".jsonc", ".html",
    # ansible / yaml
    ".yml", ".yaml",
    # bash / shell
    ".sh",
    # python
    ".py",
    # terraform
    ".tf", ".tfvars",
    # configs / locks
    ".cfg", ".lock",
}

# === Явно исключаемые директории ===
EXCLUDED_DIRS = {
    # Система и IDE
    ".git", ".idea", ".vscode",

    # Сборка и кэш (Front/General)
    "node_modules", "dist", "build", ".next", ".nuxt",
    "coverage", ".turbo", ".cache",

    # PYTHON / Virtual Envs
    ".venv", "venv", "env", ".env",
    "__pycache__",
    "Lib", "site-packages", "Scripts",
    ".pytest_cache", ".mypy_cache",
    ".tox", ".eggs",

    # Terraform
    ".terraform",
}

# Явно исключаемые файлы по имени
EXCLUDED_FILES: set[str] = {
    "package-lock.json",
}

# Явно исключаемые расширения (ассеты/бинарники)
EXCLUDED_EXT = {
    ".map", ".svg", ".png", ".jpg", ".jpeg", ".gif", ".ico", ".webp",
    ".bmp", ".pdf", ".mp4", ".mp3", ".wav",
    ".woff", ".woff2", ".ttf", ".eot",
    ".pyc", ".pyo", ".pyd", ".whl",
}

# Конкретные мусорные файлы по относительному пути от PROJECT_DIR
UNWANTED_RELATIVE_PATHS = {
    "QMS-Client-main/package-lock.json",
    "QMS-Server-master/package-lock.json",
    "QMS-Client-main/README.md",
    "QMS-Client-main/src/components/Test/Test.tsx",
}

# Лимиты: обрезать очень большие исходники
MAX_FILE_SIZE_BYTES = 400_000
MAX_LINES_PER_FILE = 2000


def is_excluded_dir(name: str) -> bool:
    return name in EXCLUDED_DIRS or name.endswith(".egg-info")


def should_keep_root_file(p: Path) -> bool:
    return p.name in ALLOWED_ROOT_FILES


def is_dump_file(path: Path) -> bool:
    """
    Проверяет, является ли файл одним из дампов:
    project_dump_core*.txt
    """
    return (
        path.suffix == DUMP_EXTENSION
        and path.stem.startswith(DUMP_BASENAME_PREFIX)
    )


def should_keep(path: Path) -> bool:
    """
    Общая логика отбора файлов
    """
    if is_dump_file(path):
        return False

    try:
        rel = path.relative_to(PROJECT_DIR).as_posix()
    except ValueError:
        rel = path.as_posix()

    if rel in UNWANTED_RELATIVE_PATHS:
        return False

    if any(part in EXCLUDED_DIRS for part in path.parts):
        return False

    if path.name in EXCLUDED_FILES:
        return False

    if path.suffix.lower() in EXCLUDED_EXT:
        return False

    if path.parent == PROJECT_DIR and should_keep_root_file(path):
        return True

    if path.suffix.lower() in ALLOWED_EXT:
        return True

    return False


def gather_files() -> list[Path]:
    files: list[Path] = []
    for root, dirs, filenames in os.walk(PROJECT_DIR):
        dirs[:] = [d for d in dirs if not is_excluded_dir(d)]
        for fn in filenames:
            p = Path(root) / fn
            if not p.is_file():
                continue
            if should_keep(p):
                files.append(p)
    return sorted(files, key=lambda x: x.relative_to(PROJECT_DIR).as_posix())


# ---------------------------
#  Comment stripping helpers
# ---------------------------

def _strip_html_comments(text: str) -> str:
    # Удаляет <!-- ... -->, сохраняя переводы строк внутри блока
    out: list[str] = []
    i = 0
    n = len(text)
    while i < n:
        if text.startswith("<!--", i):
            j = text.find("-->", i + 4)
            if j == -1:
                out.extend("\n" for ch in text[i:] if ch == "\n")
                break
            seg = text[i:j + 3]
            out.extend("\n" for ch in seg if ch == "\n")
            i = j + 3
        else:
            out.append(text[i])
            i += 1
    return "".join(out)


def _strip_hash_line_comments(text: str, *, keep_shebang: bool = True) -> str:
    """
    Удаляет # комментарии построчно (YAML/SH).
    Сохраняет shebang в первой строке.
    """
    out_lines: list[str] = []
    lines = text.splitlines(keepends=True)

    for idx, line in enumerate(lines):
        if keep_shebang and idx == 0 and line.startswith("#!"):
            out_lines.append(line)
            continue

        in_s = False
        in_d = False
        i = 0
        while i < len(line):
            ch = line[i]
            if ch == "'" and not in_d:
                in_s = not in_s
                i += 1
                continue
            if ch == '"' and not in_s:
                in_d = not in_d
                i += 1
                continue
            if ch == "#" and not in_s and not in_d:
                # режем если в начале или после пробела
                if i == 0 or line[i - 1].isspace():
                    nl = "\n" if line.endswith("\n") else ""
                    out_lines.append(line[:i].rstrip() + nl)
                    break
            i += 1
        else:
            out_lines.append(line)

    return "".join(out_lines)


def _strip_c_like_comments(text: str) -> str:
    """
    Удаляет // и /* */ комментарии, стараясь не трогать строки.
    Это эвристика, но для дампа под контекст обычно достаточно.
    """
    CODE, SQ, DQ, BT, LINE, BLOCK = range(6)
    state = CODE
    out: list[str] = []
    i = 0
    n = len(text)
    esc = False

    while i < n:
        ch = text[i]
        nxt = text[i + 1] if i + 1 < n else ""

        if state == CODE:
            if ch == "/" and nxt == "/":
                state = LINE
                i += 2
                continue
            if ch == "/" and nxt == "*":
                state = BLOCK
                i += 2
                continue
            if ch == "'":
                state = SQ
                out.append(ch)
                esc = False
                i += 1
                continue
            if ch == '"':
                state = DQ
                out.append(ch)
                esc = False
                i += 1
                continue
            if ch == "`":
                state = BT
                out.append(ch)
                esc = False
                i += 1
                continue

            out.append(ch)
            i += 1
            continue

        if state == LINE:
            if ch == "\n":
                out.append("\n")
                state = CODE
            i += 1
            continue

        if state == BLOCK:
            if ch == "\n":
                out.append("\n")
                i += 1
                continue
            if ch == "*" and nxt == "/":
                state = CODE
                i += 2
                continue
            i += 1
            continue

        # strings/template
        out.append(ch)
        if esc:
            esc = False
        else:
            if ch == "\\":
                esc = True
            else:
                if state == SQ and ch == "'":
                    state = CODE
                elif state == DQ and ch == '"':
                    state = CODE
                elif state == BT and ch == "`":
                    state = CODE
        i += 1

    return "".join(out)


def _strip_python(text: str, *, keep_docstrings: bool) -> str:
    # Сохраняем shebang (если есть)
    shebang = ""
    rest = text
    if text.startswith("#!"):
        first, _, remainder = text.partition("\n")
        shebang = first + "\n"
        rest = remainder

    try:
        tokgen = tokenize.generate_tokens(io.StringIO(rest).readline)
    except Exception:
        return shebang + _strip_hash_line_comments(rest, keep_shebang=False)

    out_tokens: list[tuple[int, str]] = []
    prev_type = tokenize.INDENT
    at_block_start = True

    for tok in tokgen:
        ttype = tok.type
        tstr = tok.string

        if ttype == tokenize.COMMENT:
            continue

        if (not keep_docstrings) and ttype == tokenize.STRING and at_block_start and prev_type in (
            tokenize.INDENT, tokenize.NEWLINE, tokenize.NL, tokenize.DEDENT, tokenize.ENCODING
        ):
            # выкидываем docstring в начале модуля/функции/класса
            prev_type = ttype
            at_block_start = False
            continue

        out_tokens.append((ttype, tstr))

        if ttype == tokenize.INDENT:
            at_block_start = True
        elif ttype not in (tokenize.NL, tokenize.NEWLINE, tokenize.ENDMARKER, tokenize.ENCODING):
            at_block_start = False

        prev_type = ttype

    return shebang + tokenize.untokenize(out_tokens)


def strip_comments_for_file(path: Path, content: str) -> str:
    if not STRIP_COMMENTS_IN_DUMP:
        return content

    ext = path.suffix.lower()

    if ext == ".py":
        return _strip_python(content, keep_docstrings=KEEP_PY_DOCSTRINGS)

    if ext in {".html", ".htm", ".md"}:
        return _strip_html_comments(content)

    if ext in {".yml", ".yaml", ".sh"}:
        return _strip_hash_line_comments(content, keep_shebang=True)

    if ext in {".tf", ".tfvars"}:
        content = _strip_c_like_comments(content)
        content = _strip_hash_line_comments(content, keep_shebang=False)
        return content

    if ext in {".ts", ".tsx", ".js", ".jsx", ".css", ".json", ".jsonc", ".cfg", ".lock"}:
        return _strip_c_like_comments(content)

    return content


def read_file_safely(p: Path) -> tuple[str, bool]:
    """
    Возвращает (content, truncated_flag).
    Обрезает по размеру или по числу строк, чтобы не раздувать дамп.
    Плюс (опционально) удаляет комментарии в дампе.
    """
    truncated = False
    try:
        size = p.stat().st_size
        if size > MAX_FILE_SIZE_BYTES:
            return (
                f"[Пропущено: файл {size} байт больше лимита {MAX_FILE_SIZE_BYTES}]\n",
                True,
            )

        with p.open("r", encoding="utf-8", errors="replace") as f:
            lines = f.readlines()

        if len(lines) > MAX_LINES_PER_FILE:
            truncated = True
            lines = lines[:MAX_LINES_PER_FILE]
            lines.append(f"\n[... обрезано до {MAX_LINES_PER_FILE} строк ...]\n")

        content = "".join(lines)

        # ВАЖНО: стриппим после обрезки, чтобы не тратить время на гигантов
        content = strip_comments_for_file(p, content)

        return content, truncated
    except Exception as e:
        return f"[Ошибка чтения файла: {e}]\n", True


def main():
    print(f"Стартую сборку из каталога: {PROJECT_DIR}")

    output_file = get_next_output_file(PROJECT_DIR)
    print(f"Файл дампа: {output_file.name}")

    files = gather_files()

    toc_lines = ["PROJECT CORE FILES OVERVIEW\n", "=" * 80 + "\n"]
    for f in files:
        toc_lines.append(f"- {f.relative_to(PROJECT_DIR).as_posix()}\n")
    toc_lines.append("\n\n")

    with output_file.open("w", encoding="utf-8") as out:
        out.writelines(toc_lines)

        for f in files:
            rel = f.relative_to(PROJECT_DIR).as_posix()
            out.write("=" * 80 + "\n")
            out.write(f"FILE: {rel}\n")
            out.write("=" * 80 + "\n\n")

            content, _truncated = read_file_safely(f)
            out.write(content)
            out.write("\n")

    print(f"Готово: {output_file}")
    print(f"Файлов собрано: {len(files)}")

    if STRIP_COMMENTS_IN_DUMP:
        print("Комментарии в дампе: УДАЛЕНЫ (исходники проекта не изменены).")
    else:
        print("Комментарии в дампе: НЕ трогал.")


if __name__ == "__main__":
    main()
