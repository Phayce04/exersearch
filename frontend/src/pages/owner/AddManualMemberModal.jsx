import React, { useState, useEffect, useMemo } from "react";
import Swal from "sweetalert2";
import { UserPlus, X, Upload } from "lucide-react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import {
  MEMBERSHIP_STATUS,
  ownerCreateManualMember,
  ownerImportManualMembers,
} from "../../utils/gymMembershipApi";
import "./MemberModal.css";

function Modal({ open, title, subtitle, onClose, children, actions }) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal-content" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>{title}</h2>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <button className="modal-close" type="button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-form">{children}</div>

        <div className="form-actions">{actions}</div>
      </div>
    </div>
  );
}

function toISODate(v) {
  if (!v) return null;
  if (typeof v === "string") {
    const s = v.trim();
    if (!s) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString().slice(0, 10);
  }

  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    return v.toISOString().slice(0, 10);
  }

  if (typeof v === "number") {
    const d = XLSX.SSF.parse_date_code(v);
    if (!d) return null;
    const yyyy = String(d.y).padStart(4, "0");
    const mm = String(d.m).padStart(2, "0");
    const dd = String(d.d).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  return null;
}

function normalizeRow(raw) {
  const fullName =
    raw.full_name ?? raw.fullName ?? raw.name ?? raw["Full name"] ?? raw["Full Name"] ?? raw["full name"];

  const email = raw.email ?? raw.Email ?? raw["E-mail"];
  const contact =
    raw.contact_number ?? raw.contact ?? raw.phone ?? raw["Contact number"] ?? raw["contact number"];

  const statusRaw = (raw.status ?? raw.Status ?? "").toString().trim().toLowerCase();
  const status =
    statusRaw && Object.values(MEMBERSHIP_STATUS).includes(statusRaw)
      ? statusRaw
      : MEMBERSHIP_STATUS.ACTIVE;

  const startDate = toISODate(raw.start_date ?? raw.startDate ?? raw["Start date"] ?? raw["start date"]);
  const endDate = toISODate(raw.end_date ?? raw.endDate ?? raw["End date"] ?? raw["end date"]);

  const planType = raw.plan_type ?? raw.planType ?? raw["Plan type"] ?? raw["plan type"];
  const notes = raw.notes ?? raw.Notes;

  return {
    full_name: (fullName ?? "").toString().trim(),
    email: (email ?? "").toString().trim() || null,
    contact_number: (contact ?? "").toString().trim() || null,
    status,
    start_date: startDate,
    end_date: endDate,
    plan_type: (planType ?? "").toString().trim() || null,
    notes: (notes ?? "").toString().trim() || null,
  };
}

function validateRows(rows) {
  const errors = [];
  rows.forEach((r, idx) => {
    if (!r.full_name) errors.push({ row: idx + 1, field: "full_name", message: "Full name is required" });
    if (r.end_date && r.start_date && r.end_date < r.start_date) {
      errors.push({ row: idx + 1, field: "end_date", message: "End date must be >= start date" });
    }
  });
  return errors;
}

function AddManualMemberModal({ open, onClose, gymId, onAdded }) {
  const [tab, setTab] = useState("single");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [contact, setContact] = useState("");
  const [status, setStatus] = useState(MEMBERSHIP_STATUS.ACTIVE);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [planType, setPlanType] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const [bulkFileName, setBulkFileName] = useState("");
  const [bulkRows, setBulkRows] = useState([]);
  const [bulkErrors, setBulkErrors] = useState([]);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (!open) return;

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const todayStr = `${yyyy}-${mm}-${dd}`;

    const end = new Date(today);
    end.setMonth(end.getMonth() + 1);
    const eyyyy = end.getFullYear();
    const emm = String(end.getMonth() + 1).padStart(2, "0");
    const edd = String(end.getDate()).padStart(2, "0");

    setTab("single");

    setFullName("");
    setEmail("");
    setContact("");
    setStatus(MEMBERSHIP_STATUS.ACTIVE);
    setStartDate(todayStr);
    setEndDate(`${eyyyy}-${emm}-${edd}`);
    setPlanType("");
    setNotes("");
    setSaving(false);

    setBulkFileName("");
    setBulkRows([]);
    setBulkErrors([]);
    setImporting(false);
  }, [open]);

  const bulkPreview = useMemo(() => bulkRows.slice(0, 8), [bulkRows]);

  async function handleAdd() {
    if (!gymId) return;

    if (!fullName.trim()) {
      Swal.fire({ icon: "error", title: "Full name required" });
      return;
    }

    setSaving(true);

    try {
      await ownerCreateManualMember(gymId, {
        full_name: fullName.trim(),
        email: email.trim() || null,
        contact_number: contact.trim() || null,
        status,
        start_date: startDate || null,
        end_date: endDate || null,
        plan_type: planType || null,
        notes: notes || null,
      });

      Swal.fire({
        icon: "success",
        title: "Manual member added",
        timer: 1100,
        showConfirmButton: false,
      });

      onClose();
      onAdded?.();
    } catch (e) {
      setSaving(false);
      Swal.fire({
        icon: "error",
        title: "Add failed",
        text: e?.response?.data?.message || e?.message || "Something went wrong",
      });
    }
  }

  async function handleFilePick(file) {
    if (!file) return;

    const name = file.name || "";
    const ext = name.split(".").pop()?.toLowerCase();
    setBulkFileName(name);
    setBulkRows([]);
    setBulkErrors([]);

    try {
      if (ext === "csv") {
        const text = await file.text();
        const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
        const rows = (parsed.data || []).map(normalizeRow).filter((r) => r.full_name || r.email || r.contact_number);
        const errs = validateRows(rows);
        setBulkRows(rows);
        setBulkErrors(errs);
        return;
      }

      if (ext === "xlsx" || ext === "xls") {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(ws, { defval: "" });
        const rows = (json || []).map(normalizeRow).filter((r) => r.full_name || r.email || r.contact_number);
        const errs = validateRows(rows);
        setBulkRows(rows);
        setBulkErrors(errs);
        return;
      }

      Swal.fire({ icon: "error", title: "Unsupported file", text: "Upload a .csv, .xlsx, or .xls file." });
    } catch (e) {
      Swal.fire({ icon: "error", title: "Failed to read file", text: e?.message || "Something went wrong" });
    }
  }

  function downloadTemplate() {
    const headers = [
      "full_name",
      "email",
      "contact_number",
      "status",
      "start_date",
      "end_date",
      "plan_type",
      "notes",
    ];
    const sample = [
      ["Juan Dela Cruz", "juan@email.com", "09123456789", "active", "2026-02-23", "2026-03-23", "Monthly", ""],
      ["Maria Santos", "", "09999999999", "intent", "2026-02-23", "", "Walk-in", "First visit promo"],
    ];
    const csv = [headers.join(","), ...sample.map((r) => r.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(","))].join(
      "\n"
    );

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "manual_members_template.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function handleImport() {
    if (!gymId) return;

    if (!bulkRows.length) {
      Swal.fire({ icon: "error", title: "No rows to import" });
      return;
    }

    if (bulkErrors.length) {
      Swal.fire({
        icon: "error",
        title: "Fix validation errors first",
        text: `Found ${bulkErrors.length} issue(s).`,
      });
      return;
    }

    setImporting(true);

    try {
      const res = await ownerImportManualMembers(gymId, bulkRows);

      Swal.fire({
        icon: "success",
        title: "Import complete",
        text: `Inserted ${res?.inserted ?? 0} row(s).`,
      });

      onClose();
      onAdded?.();
    } catch (e) {
      setImporting(false);
      const payload = e?.response?.data;
      Swal.fire({
        icon: "error",
        title: "Import failed",
        text: payload?.message || e?.message || "Something went wrong",
      });
    }
  }

  return (
    <Modal
      open={open}
      title="Add Manual Member"
      subtitle="Add a member even if they don’t have an app account yet."
      onClose={onClose}
      actions={
        <>
          <div className="action-group">
            <button className="btn-secondary" type="button" onClick={onClose} disabled={saving || importing}>
              Close
            </button>
          </div>

          <div className="action-group">
            {tab === "single" ? (
              <button className="btn-primary" type="button" onClick={handleAdd} disabled={saving}>
                {saving ? <span className="btn-spinner" /> : <UserPlus size={18} />}
                Add
              </button>
            ) : (
              <button className="btn-primary" type="button" onClick={handleImport} disabled={importing}>
                {importing ? <span className="btn-spinner" /> : <Upload size={18} />}
                Import
              </button>
            )}
          </div>
        </>
      }
    >
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <button
          type="button"
          className={tab === "single" ? "btn-primary" : "btn-secondary"}
          onClick={() => setTab("single")}
          disabled={saving || importing}
        >
          Single
        </button>
        <button
          type="button"
          className={tab === "bulk" ? "btn-primary" : "btn-secondary"}
          onClick={() => setTab("bulk")}
          disabled={saving || importing}
        >
          Import CSV/Excel
        </button>
      </div>

      {tab === "single" ? (
        <>
          <div className="form-group">
            <label>
              Full name <span className="required">*</span>
            </label>
            <input
              className="form-input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Juan Dela Cruz"
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="member@email.com" />
          </div>

          <div className="form-group">
            <label>Contact number</label>
            <input className="form-input" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="09xx xxx xxxx" />
          </div>

          <div className="form-group">
            <label>Status</label>
            <select className="form-input" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value={MEMBERSHIP_STATUS.INTENT}>Intent</option>
              <option value={MEMBERSHIP_STATUS.ACTIVE}>Active</option>
              <option value={MEMBERSHIP_STATUS.EXPIRED}>Expired</option>
              <option value={MEMBERSHIP_STATUS.CANCELLED}>Cancelled</option>
              <option value={MEMBERSHIP_STATUS.REJECTED}>Rejected</option>
            </select>
          </div>

          <div className="form-group">
            <label>Start date</label>
            <input className="form-input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>

          <div className="form-group">
            <label>End date</label>
            <input className="form-input" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>

          <div className="form-group">
            <label>Plan type</label>
            <input className="form-input" value={planType} onChange={(e) => setPlanType(e.target.value)} placeholder="Monthly / Annual / etc." />
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea className="form-input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes..." />
          </div>
        </>
      ) : (
        <>
          <div className="form-group">
            <label>Upload CSV / Excel</label>

            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                className="form-input"
                onChange={(e) => handleFilePick(e.target.files?.[0])}
              />
              <button type="button" className="btn-secondary" onClick={downloadTemplate} disabled={saving || importing}>
                Download template
              </button>
            </div>

            {bulkFileName ? <p style={{ marginTop: 8, opacity: 0.85 }}>Selected: {bulkFileName}</p> : null}
          </div>

          <div className="form-group">
            <label>Parsed rows</label>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ opacity: 0.9 }}>{bulkRows.length} row(s)</div>
              {bulkErrors.length ? (
                <div style={{ color: "#ff5c5c" }}>{bulkErrors.length} issue(s) found</div>
              ) : bulkRows.length ? (
                <div style={{ color: "#2ecc71" }}>Ready to import</div>
              ) : null}
            </div>
          </div>

          {bulkErrors.length ? (
            <div className="form-group">
              <label>Issues</label>
              <div
                style={{
                  maxHeight: 160,
                  overflow: "auto",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 10,
                  padding: 10,
                }}
              >
                {bulkErrors.slice(0, 20).map((er, i) => (
                  <div key={i} style={{ color: "#ff8c8c", marginBottom: 6 }}>
                    Row {er.row}: {er.field} — {er.message}
                  </div>
                ))}
                {bulkErrors.length > 20 ? <div style={{ opacity: 0.8 }}>+ {bulkErrors.length - 20} more…</div> : null}
              </div>
            </div>
          ) : null}

          {bulkPreview.length ? (
            <div className="form-group">
              <label>Preview</label>
              <div
                style={{
                  maxHeight: 210,
                  overflow: "auto",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 10,
                }}
              >
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["full_name", "email", "contact_number", "status", "start_date", "end_date", "plan_type"].map((h) => (
                        <th
                          key={h}
                          style={{
                            textAlign: "left",
                            padding: "10px 12px",
                            borderBottom: "1px solid rgba(255,255,255,0.12)",
                            fontWeight: 700,
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bulkPreview.map((r, idx) => (
                      <tr key={idx}>
                        <td style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{r.full_name}</td>
                        <td style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{r.email || ""}</td>
                        <td style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{r.contact_number || ""}</td>
                        <td style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{r.status}</td>
                        <td style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{r.start_date || ""}</td>
                        <td style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{r.end_date || ""}</td>
                        <td style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{r.plan_type || ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {bulkRows.length > bulkPreview.length ? (
                <p style={{ marginTop: 8, opacity: 0.8 }}>Showing first {bulkPreview.length} rows…</p>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </Modal>
  );
}

export default AddManualMemberModal;