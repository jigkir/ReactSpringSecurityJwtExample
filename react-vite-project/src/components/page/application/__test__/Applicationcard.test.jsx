import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {getEmployerInterviewsByApplicationId} from '../../../api/Api.jsx';

vi.mock('../../../api/Api.jsx', () => ({
    getEmployerInterviewsByApplicationId: vi.fn(),
    createInterview: vi.fn(),
    updateInterview: vi.fn(),
    getApplicationCoverLetter: vi.fn(),
    getApplicationTranscript: vi.fn(),
}));

vi.mock('../../../documents/PdfPreview.jsx', () => ({
    default: ({doc}) => <div data-testid="pdf-preview">{doc.fileName}</div>
}));

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key) => {
            const translations = {
                "viewApplication.new": "New",
                "cvPreview.closeBtn": "Close Preview",
                "cvDocuments.viewCVBtn": "View CV",
                "applicationCard.coverLetter": "Cover letter",
                "applicationCard.transcript": "Transcript",
            };
            return translations[key] || key;
        }
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
            id: 7, firstName: 'John', lastName: 'Doe', email: 'john.doe@example.com'
        }, cvFileName: 'resume.pdf'
    };

    const mockTogglePreview = vi.fn();
    const mockGetUrl = vi.fn();

    const renderCard = (props = {}) => render(<ApplicationCard
        application={mockApplication}
        dark={false}
        isNew={false}
        isPreviewOpen={false}
        onTogglePreview={mockTogglePreview}
        getUrl={mockGetUrl}
        {...props}
    />);

    const waitForInterviewLoad = () =>
        waitFor(() => expect(getEmployerInterviewsByApplicationId).toHaveBeenCalledWith(mockApplication.id));

    beforeEach(() => {
        vi.clearAllMocks();
        getEmployerInterviewsByApplicationId.mockResolvedValue([]);
    });

    it('renders student information and CV file name correctly', async () => {
        renderCard();
        await waitForInterviewLoad();

        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
        expect(screen.getByText('resume.pdf')).toBeInTheDocument();
        expect(screen.getByText('View CV')).toBeInTheDocument();
        expect(screen.queryByTestId('pdf-preview')).not.toBeInTheDocument();
    });

    it('shows a translated placeholder when the application has no CV file name', async () => {
        renderCard({application: {...mockApplication, cvFileName: undefined}});
        await waitForInterviewLoad();

        expect(screen.getByText('applicationCard.noCv')).toBeInTheDocument();
    });

    it('shows "New" badge when isNew is true', async () => {
        renderCard({isNew: true});
        await waitForInterviewLoad();

        expect(screen.getByText('New')).toBeInTheDocument();
    });

    it('calls onTogglePreview when view button is clicked using fireEvent', async () => {
        renderCard();
        await waitForInterviewLoad();

        fireEvent.click(screen.getByRole('button', {name: /View CV/i}));

        expect(mockTogglePreview).toHaveBeenCalledTimes(1);
    });

    it('renders the PDF preview and close button when isPreviewOpen is true', async () => {
        renderCard({isPreviewOpen: true});
        await waitForInterviewLoad();

        expect(screen.getByText('Close Preview')).toBeInTheDocument();
        expect(screen.getByTestId('pdf-preview')).toHaveTextContent('resume.pdf');
    });

    it('shows no cover letter or transcript button when the application has none', async () => {
        renderCard();
        await waitForInterviewLoad();

        expect(screen.queryByText('Cover letter')).not.toBeInTheDocument();
        expect(screen.queryByText('Transcript')).not.toBeInTheDocument();
    });

    it('shows exactly one cover letter button and previews the cover letter, not the CV', async () => {
        renderCard({application: {...mockApplication, coverLetterId: 5, coverLetterFileName: 'letter.pdf'}});
        await waitForInterviewLoad();

        const coverButtons = screen.getAllByText('Cover letter');
        expect(coverButtons).toHaveLength(1);

        fireEvent.click(coverButtons[0]);

        expect(screen.getByTestId('pdf-preview')).toHaveTextContent('letter.pdf');
        expect(screen.getByText('Cover letter').closest('button')).toHaveAttribute('aria-expanded', 'true');
        expect(screen.getByText('View CV').closest('button')).toHaveAttribute('aria-expanded', 'false');
    });

    it('opens one document preview at a time', async () => {
        renderCard({application: {
            ...mockApplication,
            coverLetterId: 5, coverLetterFileName: 'letter.pdf',
            transcriptId: 6, transcriptFileName: 'transcript.pdf',
        }});
        await waitForInterviewLoad();

        fireEvent.click(screen.getByText('Cover letter'));
        fireEvent.click(screen.getByText('Transcript'));

        expect(screen.getAllByTestId('pdf-preview')).toHaveLength(1);
        expect(screen.getByTestId('pdf-preview')).toHaveTextContent('transcript.pdf');
    });

    it('offers to schedule an interview when the application has none', async () => {
        renderCard();
        await waitForInterviewLoad();

        expect(screen.getByText('employerInternship.openInterviewPicker')).toBeInTheDocument();
    });

    it('offers to edit the interview request when one already exists', async () => {
        getEmployerInterviewsByApplicationId.mockResolvedValue([{id: 5, message: 'Hello'}]);
        renderCard();

        expect(await screen.findByText('employerInternship.editInterviewPicker')).toBeInTheDocument();
    });

    it('falls back to "schedule an interview" when the interviews fail to load', async () => {
        getEmployerInterviewsByApplicationId.mockRejectedValue(new Error('boom'));
        renderCard();
        await waitForInterviewLoad();

        expect(screen.getByText('employerInternship.openInterviewPicker')).toBeInTheDocument();
    });
});