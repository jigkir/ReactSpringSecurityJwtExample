import {fireEvent, render, screen} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {DevModeProvider, DevModeToggle, useDevMode} from '../DevMode.jsx';

vi.mock('../../config/Config.jsx', () => ({
    DEV_MODE_ENABLED: true,
    default: 'http://localhost:8080/api/',
}));

function DevModeStatus() {
    const {devAvailable, devMode} = useDevMode();
    return (
        <div>
            <span data-testid="available">{String(devAvailable)}</span>
            <span data-testid="mode">{String(devMode)}</span>
        </div>
    );
}

const renderWithProvider = () => render(
    <DevModeProvider>
        <DevModeStatus/>
        <DevModeToggle dark={false}/>
    </DevModeProvider>
);

const getToggle = () => screen.getByRole('button', {name: 'Dev'});

beforeEach(() => {
    localStorage.clear();
});

describe('DevModeProvider (Dev Mode enabled)', () => {
    it('shouldStartOffWhenNothingIsStored', () => {
        renderWithProvider();

        expect(screen.getByTestId('available')).toHaveTextContent('true');
        expect(screen.getByTestId('mode')).toHaveTextContent('false');
    });

    it('shouldRestoreDevModeFromLocalStorage', () => {
        localStorage.setItem('devMode', 'true');

        renderWithProvider();

        expect(screen.getByTestId('mode')).toHaveTextContent('true');
    });

    it('shouldTurnOnAndPersistWhenToggleIsClicked', () => {
        renderWithProvider();

        fireEvent.click(getToggle());

        expect(screen.getByTestId('mode')).toHaveTextContent('true');
        expect(localStorage.getItem('devMode')).toBe('true');
    });

    it('shouldTurnOffAgainWhenToggleIsClickedTwice', () => {
        renderWithProvider();

        fireEvent.click(getToggle());
        fireEvent.click(getToggle());

        expect(screen.getByTestId('mode')).toHaveTextContent('false');
        expect(localStorage.getItem('devMode')).toBe('false');
    });
});

describe('DevModeToggle (Dev Mode enabled)', () => {
    it('shouldShowEnableTitleAndNotPressedWhenOff', () => {
        renderWithProvider();

        expect(getToggle()).toHaveAttribute('aria-pressed', 'false');
        expect(getToggle()).toHaveAttribute('title', 'Activer le mode Dev');
    });

    it('shouldShowDisableTitleAndPressedWhenOn', () => {
        localStorage.setItem('devMode', 'true');

        renderWithProvider();

        expect(getToggle()).toHaveAttribute('aria-pressed', 'true');
        expect(getToggle()).toHaveAttribute('title', 'Désactiver le mode Dev');
    });

    it('shouldRenderNothingWhenUsedWithoutProvider', () => {
        render(<DevModeToggle dark={false}/>);

        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
});