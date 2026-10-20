import {render, screen, fireEvent} from '@testing-library/react';
import {describe, it, expect, vi, beforeEach} from 'vitest';


vi.mock('../../cv/CvPreview.jsx', () => ({
    default: () => <div data-testid="cv-preview">CvPreview Component</div>
}));


vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key) => {
            const translations = {
                "viewApplication.new": "New", "cvPreview.closeBtn": "Close Preview", "cvDocuments.viewBtn": "View CV"
            };
            return translations[key] || key;
        }
    })
}));


vi.mock('../../../../styles/AppStyles.jsx', () => ({
    getApplicationCardClasses: () => ({
        card: 'mock-card', title: 'mock-title', description: 'mock-desc', fileName: 'mock-file'
    })
}));

vi.mock('../../../../styles/Button.jsx', () => ({
    default: ({children, onClick, 'aria-expanded': expanded}) => (
        <button onClick={onClick} aria-expanded={expanded}>{children}</button>)
}));

import ApplicationCard from '../ApplicationCard';

describe('ApplicationCard Component', () => {
    const mockApplication = {
        id: 1, student: {
            firstName: 'John', lastName: 'Doe', email: 'john.doe@example.com'
        }, cvFileName: 'resume.pdf'
    };

    const mockTogglePreview = vi.fn();
    const mockGetUrl = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders student information and CV file name correctly', () => {
        render(<ApplicationCard
            application={mockApplication}
            dark={false}
            isNew={false}
            isPreviewOpen={false}
            onTogglePreview={mockTogglePreview}
            getUrl={mockGetUrl}
        />);

        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
        expect(screen.getByText('resume.pdf')).toBeInTheDocument();
        expect(screen.getByText('View CV')).toBeInTheDocument();
        expect(screen.queryByTestId('cv-preview')).not.toBeInTheDocument();
    });

    it('shows "New" badge when isNew is true', () => {
        render(<ApplicationCard
            application={mockApplication}
            dark={false}
            isNew={true}
            isPreviewOpen={false}
            onTogglePreview={mockTogglePreview}
            getUrl={mockGetUrl}
        />);

        expect(screen.getByText('New')).toBeInTheDocument();
    });

    it('calls onTogglePreview when view button is clicked using fireEvent', () => {
        render(<ApplicationCard
            application={mockApplication}
            dark={false}
            isNew={false}
            isPreviewOpen={false}
            onTogglePreview={mockTogglePreview}
            getUrl={mockGetUrl}
        />);

        const button = screen.getByRole('button', {name: /View CV/i});
        fireEvent.click(button);

        expect(mockTogglePreview).toHaveBeenCalledTimes(1);
    });

    it('renders CvPreview component and close button when isPreviewOpen is true', () => {
        render(<ApplicationCard
            application={mockApplication}
            dark={false}
            isNew={false}
            isPreviewOpen={true}
            onTogglePreview={mockTogglePreview}
            getUrl={mockGetUrl}
        />);

        expect(screen.getByText('Close Preview')).toBeInTheDocument();
        expect(screen.getByTestId('cv-preview')).toBeInTheDocument();
    });
});