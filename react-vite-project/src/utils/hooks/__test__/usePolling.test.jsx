import {renderHook} from "@testing-library/react";
import {REFRESH_INTERVAL_MS, usePolling} from "../usePolling.js";

const ALIGNED_TIME = REFRESH_INTERVAL_MS * 1000;
const DELAY_BEFORE_NEXT_TICK_MS = REFRESH_INTERVAL_MS / 4;

describe('usePolling', () => {

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(ALIGNED_TIME);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should call callback at each interval when polling is enabled', () => {

        const callback = vi.fn();

        renderHook(() => usePolling(callback));


        vi.advanceTimersByTime(REFRESH_INTERVAL_MS * 2);


        expect(callback).toHaveBeenCalledTimes(2);
    });

    it('should stop calling callback when component is unmounted', () => {

        const callback = vi.fn();
        const {unmount} = renderHook(() => usePolling(callback));


        unmount();

        vi.advanceTimersByTime(REFRESH_INTERVAL_MS);


        expect(callback).not.toHaveBeenCalled();
    });

    it('should call callback at next clock tick when component mounts between two ticks', () => {

        vi.setSystemTime(ALIGNED_TIME + REFRESH_INTERVAL_MS - DELAY_BEFORE_NEXT_TICK_MS);

        const callback = vi.fn();

        renderHook(() => usePolling(callback));


        vi.advanceTimersByTime(DELAY_BEFORE_NEXT_TICK_MS);


        expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should call callbacks at the same moment when components mount at different times', () => {

        const firstCallback = vi.fn();
        const secondCallback = vi.fn();

        renderHook(() => usePolling(firstCallback));

        vi.advanceTimersByTime(REFRESH_INTERVAL_MS - DELAY_BEFORE_NEXT_TICK_MS);

        renderHook(() => usePolling(secondCallback));


        vi.advanceTimersByTime(DELAY_BEFORE_NEXT_TICK_MS);


        expect(firstCallback).toHaveBeenCalledTimes(1);
        expect(secondCallback).toHaveBeenCalledTimes(1);
    });
});
