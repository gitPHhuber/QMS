import { describe, it, expect } from 'vitest';
import { calculateBatch } from '../utils';

describe('Warehouse Utils - Batch Calculator', () => {

    it('должен правильно считать полные коробки (ровное деление)', () => {

        const res = calculateBatch(1000, 100);

        expect(res.fullUnits).toBe(10);
        expect(res.remainder).toBe(0);
        expect(res.totalUnits).toBe(10);
    });

    it('должен правильно считать остаток (неровное деление)', () => {

        const res = calculateBatch(1050, 100);

        expect(res.fullUnits).toBe(10);
        expect(res.remainder).toBe(50);
        expect(res.totalUnits).toBe(11);
    });

    it('должен возвращать нули при нулевом общем количестве', () => {
        const res = calculateBatch(0, 100);

        expect(res.totalUnits).toBe(0);
        expect(res.fullUnits).toBe(0);
        expect(res.remainder).toBe(0);
    });

    it('должен обрабатывать случай, когда общее количество меньше вместимости', () => {

        const res = calculateBatch(50, 100);

        expect(res.fullUnits).toBe(0);
        expect(res.remainder).toBe(50);
        expect(res.totalUnits).toBe(1);
    });

    it('должен защищать от деления на ноль (capacity = 0)', () => {

        const res = calculateBatch(100, 0);

        expect(res.fullUnits).toBe(100);
        expect(res.totalUnits).toBe(100);
    });

    it('должен корректно обрабатывать отрицательные числа (считать как 0)', () => {
        const res = calculateBatch(-500, 100);

        expect(res.totalUnits).toBe(0);
    });
});
