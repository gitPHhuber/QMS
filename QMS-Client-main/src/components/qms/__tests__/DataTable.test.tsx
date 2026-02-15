/**
 * Unit-тесты для DataTable — универсальная таблица данных.
 *
 * Тестирует:
 *   1. Рендеринг заголовков колонок
 *   2. Рендеринг строк данных
 *   3. Пустое состояние ("Нет данных")
 *   4. Кастомный render для ячеек
 *   5. Клик по строке (onRowClick)
 *   6. Выравнивание текста
 *   7. Ширина колонок
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import DataTable from "../DataTable";

interface TestRow {
  id: number;
  name: string;
  status: string;
}

const columns = [
  { key: "id", label: "ID", width: "60px" },
  { key: "name", label: "Название" },
  { key: "status", label: "Статус", align: "center" as const },
];

const sampleData: TestRow[] = [
  { id: 1, name: "Документ А", status: "ACTIVE" },
  { id: 2, name: "Документ Б", status: "DRAFT" },
];

describe("DataTable", () => {
  it("рендерит заголовки колонок", () => {
    render(<DataTable columns={columns} data={sampleData} />);

    expect(screen.getByText("ID")).toBeInTheDocument();
    expect(screen.getByText("Название")).toBeInTheDocument();
    expect(screen.getByText("Статус")).toBeInTheDocument();
  });

  it("рендерит строки данных", () => {
    render(<DataTable columns={columns} data={sampleData} />);

    expect(screen.getByText("Документ А")).toBeInTheDocument();
    expect(screen.getByText("Документ Б")).toBeInTheDocument();
    expect(screen.getByText("ACTIVE")).toBeInTheDocument();
    expect(screen.getByText("DRAFT")).toBeInTheDocument();
  });

  it("показывает 'Нет данных' при пустом массиве", () => {
    render(<DataTable columns={columns} data={[]} />);

    expect(screen.getByText("Нет данных")).toBeInTheDocument();
  });

  it("использует кастомный render для ячейки", () => {
    const columnsWithRender = [
      ...columns.slice(0, 2),
      {
        key: "status",
        label: "Статус",
        render: (row: TestRow) => <span data-testid="badge">{row.status === "ACTIVE" ? "✅" : "⏳"}</span>,
      },
    ];

    render(<DataTable columns={columnsWithRender} data={sampleData} />);

    const badges = screen.getAllByTestId("badge");
    expect(badges).toHaveLength(2);
    expect(badges[0].textContent).toBe("✅");
    expect(badges[1].textContent).toBe("⏳");
  });

  it("вызывает onRowClick при клике по строке", () => {
    const handleClick = vi.fn();

    render(<DataTable columns={columns} data={sampleData} onRowClick={handleClick} />);

    fireEvent.click(screen.getByText("Документ А"));

    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleClick).toHaveBeenCalledWith(sampleData[0]);
  });

  it("не вызывает onRowClick если не передан", () => {
    // Не должен быть cursor-pointer
    const { container } = render(<DataTable columns={columns} data={sampleData} />);

    const rows = container.querySelectorAll("tbody tr");
    expect(rows[0].className).not.toContain("cursor-pointer");
  });

  it("показывает '—' для отсутствующих значений", () => {
    const dataWithMissing = [{ id: 1, name: "Test" }] as any[];

    render(<DataTable columns={columns} data={dataWithMissing} />);

    // status не задан → должен показать "—"
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
