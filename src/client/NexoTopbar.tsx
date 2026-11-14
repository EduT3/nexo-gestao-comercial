import {
  CalendarBlank,
  CheckCircle,
  HardDrive,
  FloppyDisk,
  SignOut,
  Storefront,
  WarningCircle,
} from "@phosphor-icons/react";
import type { Status } from "./LocalApp";

type TopbarProps = {
  status: Status;
  company: string;
  preview: boolean;
  busy: boolean;
  excelBusy: boolean;
  cashOpen?: boolean;
  onCompanyChange(value: string): void;
  onBackup(): void;
  onLogout(): void;
};

const currentDate = () =>
  new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

export function NexoTopbar({
  status,
  company,
  preview,
  busy,
  excelBusy,
  cashOpen,
  onCompanyChange,
  onBackup,
  onLogout,
}: TopbarProps) {
  return (
    <header className="topbar nexo-topbar">
      <div className="nexo-topbar-context">
        {status.companies.length > 1 && (
          <label className="nexo-company-picker">
            <Storefront size={22} aria-hidden="true" />
            <span>
              <small>Empresa em operação</small>
              <select
                id={preview ? "active-company" : undefined}
                data-tutorial-company
                value={company}
                disabled={busy || excelBusy}
                onChange={(event) => onCompanyChange(event.target.value)}
              >
                {status.companies.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </span>
          </label>
        )}
        {status.companies.length === 1 && (
          <span className="nexo-status-chip local-mode" title={status.companies[0]?.name}>
            <Storefront size={18} aria-hidden="true" />
            <span>{status.companies[0]?.name}</span>
          </span>
        )}
        {cashOpen !== undefined && (
          <span className={`nexo-status-chip ${cashOpen ? "open" : "closed"}`}>
            {cashOpen ? (
              <CheckCircle size={17} weight="fill" />
            ) : (
              <WarningCircle size={17} />
            )}
            {cashOpen ? "Caixa aberto" : "Caixa fechado"}
          </span>
        )}
        <span className="nexo-status-chip local-mode">
          <HardDrive size={18} aria-hidden="true" /> {preview ? "Demonstração" : "Modo local"}
        </span>
      </div>
      <div className="nexo-topbar-actions">
        <span className="nexo-topbar-date">
          <CalendarBlank size={19} />
          {currentDate()}
        </span>
        <span className="nexo-user-name" title={status.owner}>
          {status.owner}
        </span>
        {status.companies.some(
          (item) => item.id === company && item.role === "ADMIN",
        ) && (
          <button
            type="button"
            className="nexo-icon-action local-backup-indicator"
            title={
              preview
                ? "Conhecer backup"
                : `Backup: ${status.lastBackup ? new Date(status.lastBackup).toLocaleString("pt-BR") : "Nunca feito"}`
            }
            aria-label="Abrir Backup e dados"
            disabled={busy || excelBusy}
            onClick={onBackup}
          >
            <FloppyDisk size={20} />
          </button>
        )}
        {!preview && (
          <button
            type="button"
            className="nexo-icon-action"
            title="Sair do NEXO"
            aria-label="Sair"
            disabled={busy || excelBusy}
            onClick={onLogout}
          >
            <SignOut size={20} />
          </button>
        )}
      </div>
    </header>
  );
}
