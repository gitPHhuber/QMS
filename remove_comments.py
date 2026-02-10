#!/usr/bin/env python3
"""
Скрипт для удаления комментариев из JavaScript/TypeScript файлов.

Корректно обрабатывает:
- Строки (одинарные, двойные кавычки, backticks)
- Template literals с вложенными выражениями ${...}
- Regex literals /pattern/flags
- Triple-slash директивы TypeScript (/// <reference ...>)
- JSX комментарии {/* ... */} — удаляет вместе с фигурными скобками
"""

import os
import argparse
from pathlib import Path
from enum import Enum, auto
from typing import Optional


class State(Enum):
    CODE = auto()
    STRING_SINGLE = auto()
    STRING_DOUBLE = auto()
    TEMPLATE_STRING = auto()
    TEMPLATE_EXPR = auto()
    REGEX = auto()
    LINE_COMMENT = auto()
    BLOCK_COMMENT = auto()


class CommentRemover:
    """State-machine парсер для удаления комментариев из JS/TS."""

    # Токены после которых `/` может начинать regex, а не деление
    # ВАЖНО: добавлены ')' и ']' (частые кейсы: if (...) /re/.test(...))
    REGEX_PREV_TOKENS = {
        '(', ')', '[', ']', '{', '}', ',', ';', ':', '=', '!', '&', '|', '?',
        '~', '^', '<', '>', '+', '-', '*', '%', '\n', '\r'
    }

    # Ключевые слова после которых может идти regex
    REGEX_KEYWORDS = {
        'return', 'case', 'throw', 'in', 'instanceof', 'typeof',
        'void', 'delete', 'new', 'else', 'do', 'yield', 'await'
    }

    def __init__(self, content: str):
        self.content = content
        self.length = len(content)
        self.pos = 0
        self.result: list[str] = []

        # Для эвристики regex vs division
        self.last_significant_char = '\n'
        self.last_significant_word = ''

    def peek(self, offset: int = 0) -> str:
        idx = self.pos + offset
        return self.content[idx] if idx < self.length else ''

    def peek_str(self, length: int) -> str:
        return self.content[self.pos:self.pos + length]

    def advance(self, count: int = 1) -> str:
        s = self.content[self.pos:self.pos + count]
        self.pos += count
        return s

    def update_last_significant(self, char: str) -> None:
        """
        Обновить последний значимый символ/слово для определения regex.

        last_significant_word копит идентификатор/ключевое слово (буквы/цифры/_).
        last_significant_char — последний НЕ-пробельный НЕ-алфанум символ (оператор/разделитель).
        """
        if char.isalnum() or char == '_':
            self.last_significant_word += char
            return

        # пробелы/табы/переносы не считаем значимыми символами,
        # но слово НЕ сбрасываем, чтобы "return <space> /re/" работало.
        if char.isspace():
            return

        self.last_significant_char = char
        self.last_significant_word = ''

    def can_start_regex(self) -> bool:
        if self.last_significant_char in self.REGEX_PREV_TOKENS:
            return True
        if self.last_significant_word in self.REGEX_KEYWORDS:
            return True
        return False

    def is_triple_slash_directive(self) -> bool:
        """Проверить, является ли это TypeScript triple-slash директивой."""
        if self.peek_str(3) != '///':
            return False

        i = self.pos + 3
        rest = []
        while i < self.length and self.content[i] != '\n':
            rest.append(self.content[i])
            i += 1

        rest_stripped = ''.join(rest).strip()
        return (
            rest_stripped.startswith('<')
            and (
                'reference' in rest_stripped
                or 'amd-module' in rest_stripped
                or 'amd-dependency' in rest_stripped
            )
        )

    def is_jsx_comment_start(self) -> bool:
        """
        Проверить, является ли это началом JSX комментария {/* ... */}
        Смотрим назад: последний НЕ-пробельный символ перед '/*' должен быть '{'
        ВАЖНО: учитываем и переносы строк.
        """
        i = self.pos - 1
        while i >= 0 and self.content[i] in ' \t\r\n':
            i -= 1
        return i >= 0 and self.content[i] == '{'

    def remove_trailing_jsx_brace(self) -> None:
        """Удалить '{' который был добавлен перед JSX комментарием (и пробелы вокруг)."""
        while self.result and self.result[-1] in ' \t':
            self.result.pop()
        if self.result and self.result[-1] == '{':
            self.result.pop()
            while self.result and self.result[-1] in ' \t':
                self.result.pop()

    def process_string(self, quote: str) -> None:
        """Обработать строку в одинарных или двойных кавычках."""
        self.result.append(self.advance())  # opening quote

        while self.pos < self.length:
            ch = self.peek()
            if ch == '\\' and self.pos + 1 < self.length:
                self.result.append(self.advance(2))
            elif ch == quote:
                self.result.append(self.advance())
                return
            elif ch == '\n':
                # незакрытая строка — не ломаем файл
                self.result.append(self.advance())
                return
            else:
                self.result.append(self.advance())

    def process_template_string(self) -> None:
        """Обработать template literal с поддержкой вложенных ${...}."""
        self.result.append(self.advance())  # opening backtick

        while self.pos < self.length:
            ch = self.peek()

            if ch == '\\' and self.pos + 1 < self.length:
                self.result.append(self.advance(2))
                continue

            if ch == '`':
                self.result.append(self.advance())
                return

            if self.peek_str(2) == '${':
                self.result.append(self.advance(2))  # ${
                # Внутри выражения поддерживаем удаление комментариев
                self.process_template_expression()
                continue

            self.result.append(self.advance())

    def process_template_expression(self) -> None:
        """
        Обработать выражение ${...} внутри template literal.
        ВАЖНО: обновляем last_significant_* на '{' и '}', иначе regex-эвристика ломается.
        """
        brace_depth = 1

        while self.pos < self.length and brace_depth > 0:
            ch = self.peek()
            two = self.peek_str(2)

            if ch == '{':
                brace_depth += 1
                self.result.append(self.advance())
                self.update_last_significant('{')
                continue

            if ch == '}':
                brace_depth -= 1
                self.result.append(self.advance())
                self.update_last_significant('}')
                continue

            if ch == '"':
                self.process_string('"')
                # строка завершилась — считаем кавычку значимой границей
                self.last_significant_char = '"'
                self.last_significant_word = ''
                continue

            if ch == "'":
                self.process_string("'")
                self.last_significant_char = "'"
                self.last_significant_word = ''
                continue

            if ch == '`':
                self.process_template_string()
                self.last_significant_char = '`'
                self.last_significant_word = ''
                continue

            if two == '//':
                self.skip_line_comment()
                self.last_significant_char = '\n'
                self.last_significant_word = ''
                continue

            if two == '/*':
                newlines = self.skip_block_comment(is_jsx=False)
                self.result.append('\n' * newlines)
                # после блока комментария контекст двусмысленный — сбросим слово
                self.last_significant_word = ''
                continue

            if ch == '/':
                if self.can_start_regex():
                    nxt = self.peek(1)
                    # не regex, если очевидно это оператор/comment
                    if nxt not in ('/', '*', ' ', '\t', '\n', ''):
                        # NOTE: '/=' остаётся оператором (и это правильно),
                        # а '/=/' как regex — редкий кейс; если нужно — расширим эвристику.
                        if nxt != '=':
                            self.process_regex()
                            self.last_significant_char = '/'
                            self.last_significant_word = ''
                            continue

                self.result.append(self.advance())
                self.update_last_significant('/')
                continue

            self.result.append(self.advance())
            self.update_last_significant(ch)

    def process_regex(self) -> None:
        """Обработать regex literal /pattern/flags."""
        self.result.append(self.advance())  # opening /

        in_class = False

        while self.pos < self.length:
            ch = self.peek()

            if ch == '\\' and self.pos + 1 < self.length:
                self.result.append(self.advance(2))
                continue

            if ch == '[' and not in_class:
                in_class = True
                self.result.append(self.advance())
                continue

            if ch == ']' and in_class:
                in_class = False
                self.result.append(self.advance())
                continue

            if ch == '/' and not in_class:
                self.result.append(self.advance())  # closing /
                # flags
                while self.pos < self.length and self.peek().isalpha():
                    self.result.append(self.advance())
                return

            if ch == '\n':
                # незакрытый regex (ошибка синтаксиса) — выходим мягко
                return

            self.result.append(self.advance())

    def skip_line_comment(self) -> None:
        """Пропустить // комментарий, сохранив перенос строки."""
        self.advance(2)  # //
        while self.pos < self.length and self.peek() != '\n':
            self.advance()
        if self.pos < self.length:
            self.result.append(self.advance())  # keep '\n'

    def skip_block_comment(self, is_jsx: bool = False) -> int:
        """Пропустить /* ... */ комментарий, вернуть число переносов строк внутри."""
        self.advance(2)  # /*
        newlines = 0

        while self.pos < self.length:
            if self.peek_str(2) == '*/':
                self.advance(2)
                break
            if self.peek() == '\n':
                newlines += 1
            self.advance()

        if is_jsx:
            # Пропускаем пробелы/табы
            while self.pos < self.length and self.peek() in ' \t':
                self.advance()
            # Если есть '}', съедаем его
            if self.peek() == '}':
                self.advance()

        return newlines

    def process(self) -> str:
        while self.pos < self.length:
            ch = self.peek()
            two = self.peek_str(2)

            # Строки
            if ch == '"':
                self.process_string('"')
                self.last_significant_char = '"'
                self.last_significant_word = ''
                continue

            if ch == "'":
                self.process_string("'")
                self.last_significant_char = "'"
                self.last_significant_word = ''
                continue

            # Template literals
            if ch == '`':
                self.process_template_string()
                self.last_significant_char = '`'
                self.last_significant_word = ''
                continue

            # Triple-slash TS directives — сохраняем
            if self.is_triple_slash_directive():
                while self.pos < self.length and self.peek() != '\n':
                    self.result.append(self.advance())
                if self.pos < self.length:
                    self.result.append(self.advance())  # \n
                self.last_significant_char = '\n'
                self.last_significant_word = ''
                continue

            # Line comments
            if two == '//':
                self.skip_line_comment()
                self.last_significant_char = '\n'
                self.last_significant_word = ''
                continue

            # Block comments (including JSX)
            if two == '/*':
                is_jsx = self.is_jsx_comment_start()
                if is_jsx:
                    self.remove_trailing_jsx_brace()
                newlines = self.skip_block_comment(is_jsx=is_jsx)
                self.result.append('\n' * newlines)
                # После удаления комментария слово сбросим
                self.last_significant_word = ''
                continue

            # Возможный regex
            if ch == '/':
                if self.can_start_regex():
                    nxt = self.peek(1)
                    # исключаем очевидные не-regex случаи
                    if nxt not in ('=', '/', '*', ' ', '\t', '\n', ''):
                        # компромисс: '/=...' считаем оператором
                        if nxt != '=':
                            self.process_regex()
                            self.last_significant_char = '/'
                            self.last_significant_word = ''
                            continue

                # деление / просто символ
                self.result.append(self.advance())
                self.update_last_significant('/')
                continue

            # Обычный символ
            self.result.append(self.advance())
            self.update_last_significant(ch)

        return ''.join(self.result)


def remove_comments(content: str) -> str:
    remover = CommentRemover(content)
    return remover.process()


def clean_empty_lines(content: str) -> str:
    """Убрать лишние пустые строки (более 2 подряд → 2)."""
    lines = content.split('\n')
    cleaned = []
    empty_count = 0

    for line in lines:
        if line.strip() == '':
            empty_count += 1
            if empty_count <= 2:
                cleaned.append(line)
        else:
            empty_count = 0
            cleaned.append(line)

    return '\n'.join(cleaned)


def process_file(filepath: Path, dry_run: bool = False, verbose: bool = True) -> tuple[bool, int]:
    """Обработать один файл. Возвращает (изменён, количество_удалённых_символов)."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            original = f.read()
    except UnicodeDecodeError:
        if verbose:
            print(f"  ⚠️  Пропуск (не UTF-8): {filepath}")
        return False, 0
    except Exception as e:
        if verbose:
            print(f"  ❌ Ошибка чтения {filepath}: {e}")
        return False, 0

    cleaned = remove_comments(original)
    cleaned = clean_empty_lines(cleaned)

    # trailing whitespace
    cleaned = '\n'.join(line.rstrip() for line in cleaned.split('\n'))

    # пустые строки в конце файла
    cleaned = cleaned.rstrip() + '\n' if cleaned.strip() else ''

    diff = len(original) - len(cleaned)

    if diff > 0:
        if not dry_run:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(cleaned)
        return True, diff

    return False, 0


def find_code_files(root_dir: Path, extensions: set[str]) -> list[Path]:
    files = []

    skip_dirs = {
        'node_modules', '.git', 'dist', 'build', '.next',
        '__pycache__', '.vscode', '.idea', 'coverage'
    }

    for root, dirs, filenames in os.walk(root_dir):
        dirs[:] = [d for d in dirs if d not in skip_dirs]

        for filename in filenames:
            ext = Path(filename).suffix.lower()
            if ext in extensions:
                files.append(Path(root) / filename)

    return files


def main() -> int:
    parser = argparse.ArgumentParser(
        description='Удаление комментариев из JS/TS файлов (v2 — regex/template/triple-slash/JSX)',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Примеры:
  python remove_comments_v2.py ./src                    # Обработать папку
  python remove_comments_v2.py ./src --dry-run          # Только показать
  python remove_comments_v2.py ./src/App.tsx            # Один файл
  python remove_comments_v2.py ./src --ext .ts .tsx     # Только TS
        """
    )

    parser.add_argument('path', type=str, help='Путь к файлу или директории')
    parser.add_argument('--dry-run', '-d', action='store_true',
                        help='Не изменять файлы, только показать')
    parser.add_argument('--quiet', '-q', action='store_true',
                        help='Минимальный вывод')
    parser.add_argument('--ext', nargs='+',
                        default=['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'],
                        help='Расширения файлов')

    args = parser.parse_args()

    target = Path(args.path)
    extensions = set(args.ext)
    verbose = not args.quiet

    if not target.exists():
        print(f"❌ Путь не существует: {target}")
        return 1

    if target.is_file():
        files = [target]
    else:
        files = find_code_files(target, extensions)

    if not files:
        print(f"⚠️  Файлы с расширениями {extensions} не найдены")
        return 0

    if verbose:
        mode = "🔍 DRY-RUN" if args.dry_run else "🔧 РЕДАКТИРОВАНИЕ"
        print(f"\n{mode}")
        print(f"📁 Путь: {target}")
        print(f"📄 Файлов: {len(files)}")
        print("-" * 50)

    modified_count = 0
    total_saved = 0

    for filepath in sorted(files):
        changed, saved = process_file(filepath, dry_run=args.dry_run, verbose=verbose)
        if changed:
            modified_count += 1
            total_saved += saved
            if verbose:
                rel = filepath.relative_to(target) if target.is_dir() else filepath.name
                print(f"  ✅ {rel} (-{saved} байт)")

    if verbose:
        print("-" * 50)
        print(f"📊 Изменено: {modified_count} файл(ов)")
        print(f"💾 Сэкономлено: {total_saved:,} байт")

    return 0


if __name__ == '__main__':
    raise SystemExit(main())
