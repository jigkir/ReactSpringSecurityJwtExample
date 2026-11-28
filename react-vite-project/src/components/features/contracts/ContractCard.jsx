/**
 * ContractCard.jsx — One internship contract, as the connected party (manager, employer or student) sees it.
 *
 * Shows the offer details (position, location, work mode, period, duration, hourly rate,
 * negotiable, description, required skills), the parties (student, employer, company, signing
 * manager), the commitments of the three parties and the signature state of each party with
 * its date and time.
 * Actions: sign (inline form, only while the connected party has not signed) and "Download the
 * contract", which opens the contract page ({basePath}/:id) where the PDF can be read in French or
 * English and downloaded (see ContractFile.jsx). The student name is passed through the link
 * state so the downloaded files are named {language}-contract-{studentName}.pdf.
 *
 * Props
 *   contract      ContractResponseDto
 *   dark          boolean
 *   devMode       boolean   Dev mode: signing needs no password
 *   contractRole  {signedAtField, basePath}  see utils/ContractRole.js (default: manager)
 *   filterColor   ALL | YELLOW | GREEN  selected status filter: the card gets a border of that color
 *   onSign        function  async (contract, {termsAccepted, password}) => {success, message?}
 */

import {useState} from "react";
import {Link} from "react-router-dom";
import {useTranslation} from "react-i18next";
import Button from "../../../styles/Button.jsx";
import Icon from "../../../styles/Icon.jsx";
import {getCvDocumentsClasses, getInternshipCardClasses} from "../../../styles/AppStyles.jsx";
import {CONTRACT_ROLES, canSign} from "../../../utils/ContractRole.js";
import {ALL, borderStatusOf} from "../../../utils/StatusColor.js";
import SignContractForm from "./SignContractForm.jsx";
import {contractFilePath} from "../../../routes/AppRoutes.jsx";

const COMMITMENT_PARTIES = ["college", "employer", "student"];
const CURRENCY = "CAD";

const getBodyText = (dark) => `text-sm ${dark ? "text-white" : "text-gray-900"}`;

const parseSkills = (raw) =>
    (raw ?? "").split(",").map((skill) => skill.trim()).filter(Boolean);

// "yyyy-MM-dd" alone is read as UTC midnight: the time keeps the same day in the local time zone
const toLocalDate = (isoDate) => new Date(`${isoDate}T00:00`);

// Section title underlined like the headings of the PDF
function SectionHeading({dark, children}) {
    return (
        <h4 className={`border-b-2 pb-1 text-sm font-bold uppercase tracking-wide ${dark ? "border-sky-700 text-sky-300" : "border-[#1f3a5f] text-[#1f3a5f]"}`}>
            {children}
        </h4>
    );
}

// One party box: role, name, detail (like the three boxes of the PDF)
function PartyBox({dark, role, name, detail}) {
    return (
        <div
            className={`rounded-lg border-t-4 p-3 ${dark ? "border-sky-700 bg-slate-900/30" : "border-[#1f3a5f] bg-slate-50"}`}>
            <p className={`text-xs font-bold uppercase tracking-wide ${dark ? "text-slate-400" : "text-gray-500"}`}>{role}</p>
            <p className="font-semibold wrap-break-word">{name}</p>
            <p className={`text-sm wrap-break-word ${dark ? "text-slate-400" : "text-gray-600"}`}>{detail}</p>
        </div>
    );
}

// "The College agrees to: …" with its bullet list, like the commitments of the PDF
function CommitmentList({dark, party}) {
    const {t} = useTranslation();
    const items = t(`managerContracts.commitments.${party}.items`, {returnObjects: true});

    return (
        <div>
            <h5 className={`text-sm font-semibold ${dark ? "text-sky-300" : "text-[#1f3a5f]"}`}>
                {t(`managerContracts.commitments.${party}.title`)}
            </h5>
            <ul className={`mt-1 list-disc space-y-1 pl-6 ${getBodyText(dark)}`}>
                {Array.isArray(items) && items.map((item) => <li key={item}>{item}</li>)}
            </ul>
        </div>
    );
}

function ContractCard({
                          contract, dark, devMode = false, onSign,
                          contractRole = CONTRACT_ROLES.MANAGER, filterColor = ALL
                      }) {
    const {t, i18n} = useTranslation();
    // While a status color is selected, the card gets a full border of that color
    const s = getInternshipCardClasses(dark, borderStatusOf(filterColor));
    const th = getCvDocumentsClasses(dark);
    const bodyText = getBodyText(dark);

    const [signOpen, setSignOpen] = useState(false);

    const {internship} = contract;
    // Has the CONNECTED party (manager, employer or student) signed?
    const signedByMe = Boolean(contract[contractRole.signedAtField]);
    const fullySigned = Boolean(contract.studentSignedAt && contract.employerSignedAt && contract.managerSignedAt);
    const waitingForOtherParties = !canSign(contract, contractRole);
    const skills = parseSkills(internship.requiredSkills);
    const isFrench = i18n.resolvedLanguage?.startsWith("fr");
    const locale = isFrench ? "fr-CA" : "en-CA";

    const formatDate = (date) => new Intl.DateTimeFormat(locale, {dateStyle: "long"}).format(date);
    const formatDateTime = (date) => new Intl.DateTimeFormat(locale, {
        dateStyle: "long",
        timeStyle: "short"
    }).format(date);

    // Same as the PDF: the amount (negotiable or not is a separate term), or "not specified"
    const hourlyRate = internship.compensationAmount == null
        ? t("managerContracts.notSpecified")
        : t("managerContracts.terms.hourlyRateValue", {
            amount: new Intl.NumberFormat(locale, {
                style: "currency",
                currency: CURRENCY
            }).format(internship.compensationAmount),
        });

    const terms = [
        {key: "position", value: internship.title},
        {key: "location", value: internship.location},
        {
            key: "workMode",
            value: t(`internshipModal.workModes.${internship.workMode}`, {defaultValue: internship.workMode})
        },
        {
            key: "period",
            value: t("managerContracts.terms.periodValue", {
                start: formatDate(toLocalDate(internship.startDate)),
                end: formatDate(toLocalDate(contract.internshipEndDate)),
            }),
        },
        {key: "duration", value: t("internshipCard.durationWeeks", {count: internship.durationInWeeks})},
        {key: "hourlyRate", value: hourlyRate},
        {
            key: "negotiable",
            value: t(internship.compensationNegotiable ? "managerContracts.yes" : "managerContracts.no")
        },
    ];

    // Same order as the PDF: student, employer, then the college (manager)
    const signatures = [
        {key: "student", name: contract.studentName, signedAt: contract.studentSignedAt},
        {key: "employer", name: contract.employerName, signedAt: contract.employerSignedAt},
        {key: "college", name: contract.managerName, signedAt: contract.managerSignedAt},
    ];

    const hasActions = fullySigned || (!signedByMe && !signOpen);
    const muted = dark ? "text-slate-400" : "text-gray-500";
    const warning = dark ? "text-red-400" : "text-red-600";
    const rowBorder = dark ? "border-slate-700" : "border-gray-200";
    const divider = `border-t pt-3 ${rowBorder}`;

    const renderSignature = ({key, name, signedAt}) => {
        const signed = Boolean(signedAt);

        return (
            <tr key={key} className={`border-b ${rowBorder}`}>
                <td className="py-2 pr-3 font-semibold">{t(`managerContracts.parties.${key}`)}</td>
                <td className="py-2 pr-3 wrap-break-word">{name ?? ""}</td>
                <td className="py-2">
                    <span className={`${th.pillBase} ${th.statusPill(signed ? "APPROVED" : "PENDING")} gap-1`}>
                        <Icon name={signed ? "check_circle" : "schedule"} size={14}/>
                        {signed
                            ? t("managerContracts.signatures.signedAt", {date: formatDateTime(new Date(signedAt))})
                            : t("managerContracts.signatures.pending")}
                    </span>
                </td>
            </tr>
        );
    };

    return (
        <article className={`${s.card} space-y-5!`} aria-label={internship.title}>
            {/* Header: title band, like the top of the PDF */}
            <div
                className={`flex flex-wrap items-center justify-between gap-3 rounded-lg px-4 py-3 text-white ${dark ? "bg-sky-900" : "bg-[#1f3a5f]"}`}>
                <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-bold uppercase tracking-wide">{t("managerContracts.document.title")}</h3>
                    <p className="text-sm opacity-90 wrap-break-word">{internship.title} · {contract.companyName}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                    <span className="text-sm opacity-90">
                        {t("managerContracts.document.createdAt", {date: formatDate(new Date(contract.createdAt))})}
                    </span>
                    <span className={`${th.pillBase} ${th.statusPill(signedByMe ? "APPROVED" : "PENDING")} gap-1`}>
                        <Icon name={signedByMe ? "check_circle" : "schedule"} size={14}/>
                        {t(signedByMe ? "managerContracts.status.signed" : "managerContracts.status.toSign")}
                    </span>
                </div>
            </div>

            <p className={bodyText}>{t("managerContracts.document.introduction")}</p>

            {/* Parties */}
            <section className="space-y-3" aria-label={t("managerContracts.sections.parties")}>
                <SectionHeading dark={dark}>{t("managerContracts.sections.parties")}</SectionHeading>
                <div className="grid gap-3 sm:grid-cols-3">
                    <PartyBox
                        dark={dark}
                        role={t("managerContracts.parties.college")}
                        name={contract.managerName ?? t("managerContracts.parties.managerPending")}
                        detail={t("managerContracts.parties.managerRole")}
                    />
                    <PartyBox
                        dark={dark}
                        role={t("managerContracts.parties.employer")}
                        name={contract.companyName}
                        detail={t("managerContracts.parties.representedBy", {name: contract.employerName})}
                    />
                    <PartyBox
                        dark={dark}
                        role={t("managerContracts.parties.student")}
                        name={contract.studentName}
                        detail={t("managerContracts.parties.intern")}
                    />
                </div>
            </section>

            {/* Internship terms */}
            <section className="space-y-3" aria-label={t("managerContracts.sections.terms")}>
                <SectionHeading dark={dark}>{t("managerContracts.sections.terms")}</SectionHeading>
                <dl>
                    {terms.map(({key, value}) => (
                        <div key={key} className={`grid grid-cols-[35%_1fr] gap-3 border-b py-2 ${rowBorder}`}>
                            <dt className={`text-sm ${muted}`}>{t(`managerContracts.terms.${key}`)}</dt>
                            <dd className="text-sm font-semibold wrap-break-word">{value}</dd>
                        </div>
                    ))}
                </dl>
            </section>

            {/* Offer description: same colour and size as the commitments */}
            <section className="space-y-3" aria-label={t("managerContracts.sections.description")}>
                <SectionHeading dark={dark}>{t("managerContracts.sections.description")}</SectionHeading>
                <p className={`mt-1 w-full wrap-break-word ${bodyText}`} style={{whiteSpace: "pre-wrap"}}>
                    {internship.description}
                </p>
                {skills.length > 0 && (
                    <div className={`${s.skillsRow} flex flex-wrap items-center gap-1.5`}>
                        <span className="mr-1 font-semibold">{t("internshipCard.requiredSkills")}</span>
                        {skills.map((skill) => (
                            <span key={skill} className={s.skillBadge}>{skill}</span>
                        ))}
                    </div>
                )}
            </section>

            {/* Commitments of the parties (the full contract is on the contract page) */}
            <section className="space-y-3" aria-label={t("managerContracts.sections.commitments")}>
                <SectionHeading dark={dark}>{t("managerContracts.sections.commitments")}</SectionHeading>
                <div className="space-y-4">
                    {COMMITMENT_PARTIES.map((party) => (
                        <CommitmentList key={party} dark={dark} party={party}/>
                    ))}
                </div>
            </section>

            {/* Electronic signatures */}
            <section className="space-y-3" aria-label={t("managerContracts.signatures.title")}>
                <SectionHeading dark={dark}>{t("managerContracts.signatures.title")}</SectionHeading>
                <p className={bodyText}>{t("managerContracts.signatures.explanation")}</p>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                        <tr className={`border-b ${rowBorder} ${dark ? "text-sky-300" : "text-[#1f3a5f]"}`}>
                            <th className="py-2 pr-3">{t("managerContracts.signatures.party")}</th>
                            <th className="py-2 pr-3">{t("managerContracts.signatures.name")}</th>
                            <th className="py-2">{t("managerContracts.signatures.status")}</th>
                        </tr>
                        </thead>
                        <tbody>{signatures.map(renderSignature)}</tbody>
                    </table>
                </div>
            </section>

            {/* Sign form */}
            {!signedByMe && signOpen && (
                <SignContractForm
                    dark={dark}
                    devMode={devMode}
                    onSubmit={(payload) => onSign(contract, payload)}
                    onClose={() => setSignOpen(false)}
                />
            )}

            {/* Actions */}
            {hasActions && (
                <div
                    role="group"
                    aria-label={t("managerContracts.download.open")}
                    className={`flex flex-wrap items-center justify-end gap-2 ${divider}`}
                >
                    {fullySigned && (
                        <Button
                            as={Link}
                            to={contractFilePath(contractRole.filePath, contract.id)}
                            state={{studentName: contract.studentName}}
                            tone="accent"
                            lockTone
                            dark={dark}
                            icon="download"
                        >
                            {t("managerContracts.download.open")}
                        </Button>
                    )}
                    {!signedByMe && !signOpen && (
                        <>
                            {waitingForOtherParties && (
                                <span
                                    className={`text-sm ${warning}`}>{t("managerContracts.sign.waitingForOtherParties")}</span>
                            )}
                            <Button tone="success" lockTone dark={dark} icon="edit" disabled={waitingForOtherParties}
                                    onClick={() => setSignOpen(true)}>
                                {t("managerContracts.sign.open")}
                            </Button>
                        </>
                    )}
                </div>
            )}
        </article>
    );
}

export default ContractCard;
