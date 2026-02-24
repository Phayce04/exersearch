import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Users,
  Search,
  Calendar,
  CheckCircle2,
  X,
  XCircle,
  Ban,
  TimerReset,
  ArrowRight,
  AlertTriangle,
  Plus,
  Pencil,
  Save,
  User,
} from "lucide-react";
import Swal from "sweetalert2";
import "./OwnerMembers.css";
import AddManualMemberModal from "./AddManualMemberModal";
import "./MemberModal.css";
import { useAuthMe } from "../../utils/useAuthMe";
import { getAllMyGyms } from "../../utils/ownerGymApi";
import {
  ownerListGymMembersCombined,
  ownerListGymMemberships,
  ownerActivateMembership,
  ownerUpdateMembership,
  ownerUpdateManualMember,
  MEMBERSHIP_STATUS,
  normalizeCombinedMembersResponse,
  normalizeMembershipListResponse,
} from "../../utils/gymMembershipApi";
import { ownerExpireCheckGymMemberships } from "../../utils/gymMembershipApi";

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString();
}

function formatDateTime(value) {
  if (!value) return "-";
  const d = new Date(String(value).replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

function initials(nameOrEmail) {
  const s = String(nameOrEmail || "").trim();
  if (!s) return "?";
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function statusLabel(status) {
  if (!status) return "-";
  const map = {
    intent: "Intent",
    active: "Active",
    expired: "Expired",
    cancelled: "Cancelled",
    rejected: "Rejected",
  };
  return map[status] || status;
}

function badgeClass(status) {
  if (status === "active") return "om-badge active";
  if (status === "intent") return "om-badge intent";
  if (status === "expired") return "om-badge expired";
  if (status === "cancelled") return "om-badge cancelled";
  if (status === "rejected") return "om-badge rejected";
  return "om-badge";
}

function getMembershipId(m) {
  return (
    m?.membership_id ??
    m?.membershipId ??
    m?.membership?.membership_id ??
    m?.membership?.id ??
    m?.id ??
    null
  );
}

function isoToday() {
  return new Date().toISOString().slice(0, 10);
}

function addToISODate(isoDate, { months = 0, years = 0, days = 0 } = {}) {
  const base = isoDate ? new Date(isoDate + "T00:00:00") : new Date();
  if (Number.isNaN(base.getTime())) return isoDate;

  const d = new Date(base);
  const origDay = d.getDate();

  if (years) d.setFullYear(d.getFullYear() + years);

  if (months) {
    const targetMonth = d.getMonth() + months;
    d.setMonth(targetMonth, 1);
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(origDay, lastDay));
  }

  if (days) d.setDate(d.getDate() + days);

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

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

export default function OwnerMembers() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { me, loading: meLoading } = useAuthMe();

  const selectedGymId = useMemo(() => (id ? String(id) : null), [id]);

  const [gymLoading, setGymLoading] = useState(true);
  const [selectedGym, setSelectedGym] = useState(null);

  const [mode, setMode] = useState("combined");
  const [tab, setTab] = useState(MEMBERSHIP_STATUS.INTENT);
  const [q, setQ] = useState("");
  const [perPage, setPerPage] = useState(15);
  const [page, setPage] = useState(1);

  const [listLoading, setListLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);

  const [activateOpen, setActivateOpen] = useState(false);
  const [activateRow, setActivateRow] = useState(null);
  const [aStart, setAStart] = useState("");
  const [aEnd, setAEnd] = useState("");
  const [aPlan, setAPlan] = useState("");
  const [aNotes, setANotes] = useState("");
  const [aSaving, setASaving] = useState(false);

  const [extendOpen, setExtendOpen] = useState(false);
  const [extendRow, setExtendRow] = useState(null);
  const [eEnd, setEEnd] = useState("");
  const [eNotes, setENotes] = useState("");
  const [eSaving, setESaving] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [editStatus, setEditStatus] = useState(MEMBERSHIP_STATUS.ACTIVE);
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [editPlan, setEditPlan] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const [editFullName, setEditFullName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editContact, setEditContact] = useState("");

  const [addManualOpen, setAddManualOpen] = useState(false);

  const canManage = useMemo(() => {
    const role = me?.role;
    return role === "owner" || role === "admin" || role === "superadmin";
  }, [me]);

  useEffect(() => {
    if (!selectedGymId) return;
    setPage(1);
  }, [selectedGymId, tab, perPage, mode]);

  useEffect(() => {
    let mounted = true;

    async function loadSelectedGym() {
      if (!me || !canManage || !selectedGymId) return;

      setGymLoading(true);
      try {
        const list = await getAllMyGyms({ per_page: 200 });
        if (!mounted) return;

        const found =
          list.find((g) => String(g.gym_id ?? g.id) === String(selectedGymId)) ||
          null;

        if (!found) {
          setSelectedGym(null);
          Swal.fire({
            icon: "error",
            title: "Gym not found",
            text: "You don’t have access to this gym or it doesn’t exist.",
          });
          navigate("/owner/home");
          return;
        }

        setSelectedGym(found);
      } catch (e) {
        if (!mounted) return;
        setSelectedGym(null);
        Swal.fire({
          icon: "error",
          title: "Failed to load gym",
          text: e?.response?.data?.message || e?.message || "Something went wrong",
        });
      } finally {
        if (mounted) setGymLoading(false);
      }
    }

    loadSelectedGym();

    return () => {
      mounted = false;
    };
  }, [me, canManage, selectedGymId, navigate]);

  async function fetchList(next = {}) {
    if (!selectedGymId) return;
    setListLoading(true);
    try {
      const isCombined = mode === "combined";
      const nextQ = next.q ?? q;

      const params = {
        search: nextQ,
        q: nextQ,
        per_page: next.per_page ?? perPage,
        page: next.page ?? page,
        status: next.status ?? tab,
      };

      const data = isCombined
        ? await ownerListGymMembersCombined(selectedGymId, params)
        : await ownerListGymMemberships(selectedGymId, params);

      const norm = isCombined
        ? normalizeCombinedMembersResponse(data)
        : normalizeMembershipListResponse(data);

      const nextRows = Array.isArray(norm?.rows)
        ? norm.rows
        : Array.isArray(data?.data?.data)
          ? data.data.data
          : Array.isArray(data?.data)
            ? data.data
            : [];

      const nextMeta =
        norm?.meta ??
        (data?.data && !Array.isArray(data.data) ? data.data : null) ??
        data?.meta ??
        null;

      setRows(nextRows);
      setMeta(nextMeta);
    } catch (e) {
      setRows([]);
      setMeta(null);
      Swal.fire({
        icon: "error",
        title: "Failed to load members",
        text: e?.response?.data?.message || e?.message || "Something went wrong",
      });
    } finally {
      setListLoading(false);
    }
  }

  useEffect(() => {
    if (!selectedGymId) return;
    fetchList({ page, status: tab });
  }, [selectedGymId, tab, perPage, page, mode]);

  const filteredRows = useMemo(() => {
    const want = String(tab || "").toLowerCase();
    const isCombined = mode === "combined";
    const query = String(q || "").trim().toLowerCase();

    let base = rows;

    if (isCombined && want) {
      base = base.filter((m) => String(m?.status || "").toLowerCase() === want);
    }

    if (!query) return base;

    return base.filter((m) => {
      const source = m?.source || "app_user";
      const isManual = source === "manual";
      const name = isManual ? m?.display_name : m?.user?.name;
      const email = isManual ? m?.email : m?.user?.email;
      const phone = isManual ? m?.contact_number : m?.user?.contact_number;

      const s1 = String(name || "").toLowerCase();
      const s2 = String(email || "").toLowerCase();
      const s3 = String(phone || "").toLowerCase();

      return s1.includes(query) || s2.includes(query) || s3.includes(query);
    });
  }, [rows, tab, mode, q]);

  const totalPages = useMemo(() => {
    const last = meta?.last_page ?? meta?.meta?.last_page;
    if (typeof last === "number") return last;

    const total = meta?.total ?? meta?.meta?.total;
    const pp = meta?.per_page ?? meta?.meta?.per_page ?? perPage;
    if (typeof total === "number" && typeof pp === "number" && pp > 0) {
      return Math.max(1, Math.ceil(total / pp));
    }
    return 1;
  }, [meta, perPage]);

  const showing = useMemo(() => {
    const from = meta?.from ?? meta?.meta?.from;
    const to = meta?.to ?? meta?.meta?.to;
    const total = meta?.total ?? meta?.meta?.total;
    if (from && to && total) return `${from}-${to} of ${total}`;
    return `${filteredRows.length} shown`;
  }, [meta, filteredRows.length]);

  function openActivate(m) {
    if (m?.source === "manual") {
      Swal.fire({
        icon: "info",
        title: "Manual member",
        text: "Manual members don’t use the intent activation flow. Edit their dates instead.",
      });
      return;
    }

    const membershipId = getMembershipId(m);
    if (!membershipId) {
      Swal.fire({
        icon: "error",
        title: "Missing membership id",
        text: "This row does not include membership_id. Fix the combined API mapping/normalizer.",
      });
      return;
    }

    setActivateRow({ ...m, membership_id: membershipId });

    const todayStr = isoToday();
    setAStart(todayStr);

    const end = new Date(todayStr + "T00:00:00");
    end.setMonth(end.getMonth() + 1);
    const eyyyy = end.getFullYear();
    const emm = String(end.getMonth() + 1).padStart(2, "0");
    const edd = String(end.getDate()).padStart(2, "0");
    setAEnd(`${eyyyy}-${emm}-${edd}`);

    setAPlan(m?.plan_type || "");
    setANotes(m?.notes || "");
    setActivateOpen(true);
  }

  function closeActivate() {
    setActivateOpen(false);
    setActivateRow(null);
    setAStart("");
    setAEnd("");
    setAPlan("");
    setANotes("");
    setASaving(false);
  }

  function openExtend(m) {
    if (m?.source === "manual") {
      Swal.fire({ icon: "info", title: "Manual member", text: "Use Edit for manual members." });
      return;
    }

    const membershipId = getMembershipId(m);
    if (!membershipId) {
      Swal.fire({
        icon: "error",
        title: "Missing membership id",
        text: "This row does not include membership_id. Fix the combined API mapping/normalizer.",
      });
      return;
    }

    setExtendRow({ ...m, membership_id: membershipId });
    const endVal = m?.end_date ? String(m.end_date).slice(0, 10) : isoToday();
    setEEnd(endVal);
    setENotes("");
    setExtendOpen(true);
  }

  function closeExtend() {
    setExtendOpen(false);
    setExtendRow(null);
    setEEnd("");
    setENotes("");
    setESaving(false);
  }

  function openEdit(m) {
    setEditRow(m);

    const isManual = (m?.source || "app_user") === "manual";

    setEditStatus(m?.status || MEMBERSHIP_STATUS.ACTIVE);
    setEditStart(m?.start_date ? String(m.start_date).slice(0, 10) : "");
    setEditEnd(m?.end_date ? String(m.end_date).slice(0, 10) : "");
    setEditPlan(m?.plan_type || "");
    setEditNotes(m?.notes || "");

    if (isManual) {
      setEditFullName(m?.display_name || "");
      setEditEmail(m?.email || "");
      setEditContact(m?.contact_number || "");
    } else {
      setEditFullName(m?.user?.name || "");
      setEditEmail(m?.user?.email || "");
      setEditContact(m?.user?.contact_number || "");
    }

    setEditOpen(true);
  }

  function closeEdit() {
    setEditOpen(false);
    setEditRow(null);
    setEditStatus(MEMBERSHIP_STATUS.ACTIVE);
    setEditStart("");
    setEditEnd("");
    setEditPlan("");
    setEditNotes("");
    setEditFullName("");
    setEditEmail("");
    setEditContact("");
    setEditSaving(false);
  }

  async function doActivate() {
    if (!activateRow) return;

    if (activateRow?.source === "manual") {
      Swal.fire({
        icon: "info",
        title: "Manual member",
        text: "Manual members don’t use the intent activation flow. Edit their dates instead.",
      });
      return;
    }

    const membershipId = getMembershipId(activateRow);
    if (!membershipId) {
      Swal.fire({
        icon: "error",
        title: "Missing membership id",
        text: "This row does not include membership_id. Fix the combined API mapping/normalizer.",
      });
      return;
    }

    setASaving(true);
    try {
      await ownerActivateMembership(membershipId, {
        start_date: aStart,
        end_date: aEnd,
        plan_type: aPlan || null,
        notes: aNotes || null,
      });
      closeActivate();
      Swal.fire({
        icon: "success",
        title: "Activated",
        timer: 1100,
        showConfirmButton: false,
      });
      setPage(1);
      fetchList({ page: 1, status: tab });
    } catch (e) {
      setASaving(false);
      Swal.fire({
        icon: "error",
        title: "Activation failed",
        text: e?.response?.data?.message || e?.message || "Something went wrong",
      });
    }
  }

  async function doUpdateStatus(membershipId, payload, successTitle) {
    if (!membershipId) {
      Swal.fire({
        icon: "error",
        title: "Missing membership id",
        text: "Cannot update because membership_id is missing from this row.",
      });
      return;
    }

    try {
      await ownerUpdateMembership(membershipId, payload);
      Swal.fire({
        icon: "success",
        title: successTitle,
        timer: 1000,
        showConfirmButton: false,
      });
      setPage(1);
      fetchList({ page: 1, status: tab });
    } catch (e) {
      Swal.fire({
        icon: "error",
        title: "Update failed",
        text: e?.response?.data?.message || e?.message || "Something went wrong",
      });
    }
  }

  async function confirmAndUpdate(m, action) {
    if (m?.source === "manual") {
      Swal.fire({
        icon: "info",
        title: "Manual member",
        text: "For manual members, use Edit to update status/dates.",
      });
      return;
    }

    const membershipId = getMembershipId(m);
    if (!membershipId) {
      Swal.fire({
        icon: "error",
        title: "Missing membership id",
        text: "This row does not include membership_id. Fix the combined API mapping/normalizer.",
      });
      return;
    }

    const user = m.user || {};
    const name = user?.name || user?.email || "this member";

    if (action === "reject") {
      const r = await Swal.fire({
        icon: "warning",
        title: "Reject intent?",
        text: `Reject ${name}'s membership intent?`,
        showCancelButton: true,
        confirmButtonText: "Reject",
      });
      if (!r.isConfirmed) return;
      return doUpdateStatus(
        membershipId,
        { status: MEMBERSHIP_STATUS.REJECTED },
        "Rejected"
      );
    }

    if (action === "cancel") {
      const r = await Swal.fire({
        icon: "warning",
        title: "Cancel membership?",
        text: `Cancel ${name}'s membership?`,
        showCancelButton: true,
        confirmButtonText: "Cancel",
      });
      if (!r.isConfirmed) return;
      return doUpdateStatus(
        membershipId,
        { status: MEMBERSHIP_STATUS.CANCELLED },
        "Cancelled"
      );
    }

    if (action === "expire") {
      const r = await Swal.fire({
        icon: "warning",
        title: "Expire membership?",
        text: `Set ${name}'s membership as expired?`,
        showCancelButton: true,
        confirmButtonText: "Expire",
      });
      if (!r.isConfirmed) return;
      return doUpdateStatus(
        membershipId,
        { status: MEMBERSHIP_STATUS.EXPIRED },
        "Expired"
      );
    }
  }

  async function doExtend() {
    if (!extendRow) return;

    if (extendRow?.source === "manual") {
      Swal.fire({ icon: "info", title: "Manual member", text: "Use Edit for manual members." });
      return;
    }

    if (!eEnd) {
      Swal.fire({ icon: "error", title: "End date required" });
      return;
    }

    const membershipId = getMembershipId(extendRow);
    if (!membershipId) {
      Swal.fire({
        icon: "error",
        title: "Missing membership id",
        text: "This row does not include membership_id. Fix the combined API mapping/normalizer.",
      });
      return;
    }

    setESaving(true);
    try {
      await ownerUpdateMembership(membershipId, {
        status: MEMBERSHIP_STATUS.ACTIVE,
        end_date: eEnd,
        notes: eNotes || null,
      });
      closeExtend();
      Swal.fire({
        icon: "success",
        title: "Extended",
        timer: 1000,
        showConfirmButton: false,
      });
      setPage(1);
      fetchList({ page: 1, status: tab });
    } catch (e) {
      setESaving(false);
      Swal.fire({
        icon: "error",
        title: "Update failed",
        text: e?.response?.data?.message || e?.message || "Something went wrong",
      });
    }
  }

  async function doEditSave() {
    if (!editRow) return;

    const isManual = (editRow?.source || "app_user") === "manual";

    setEditSaving(true);
    try {
      if (isManual) {
        await ownerUpdateManualMember(selectedGymId, editRow.id, {
          full_name: editFullName?.trim() || null,
          email: editEmail?.trim() || null,
          contact_number: editContact?.trim() || null,
          status: editStatus,
          start_date: editStart || null,
          end_date: editEnd || null,
          plan_type: editPlan || null,
          notes: editNotes || null,
        });
      } else {
        const membershipId = getMembershipId(editRow);
        if (!membershipId) {
          setEditSaving(false);
          Swal.fire({
            icon: "error",
            title: "Missing membership id",
            text: "This row does not include membership_id. Fix the combined API mapping/normalizer.",
          });
          return;
        }

        await ownerUpdateMembership(membershipId, {
          status: editStatus,
          start_date: editStart || null,
          end_date: editEnd || null,
          plan_type: editPlan || null,
          notes: editNotes || null,
        });
      }

      closeEdit();
      Swal.fire({
        icon: "success",
        title: "Saved",
        timer: 1000,
        showConfirmButton: false,
      });
      setPage(1);
      fetchList({ page: 1, status: tab });
    } catch (e) {
      setEditSaving(false);
      Swal.fire({
        icon: "error",
        title: "Save failed",
        text: e?.response?.data?.message || e?.message || "Something went wrong",
      });
    }
  }

  if (!selectedGymId) {
    return (
      <div className="od-app">
        <div className="od-container">
          <div className="om-block">
            <div className="om-empty">
              <div className="om-empty-icon">
                <AlertTriangle size={22} />
              </div>
              <h3>Missing gym id</h3>
              <p>Open membership management from a specific gym.</p>
              <button
                className="om-btn primary"
                type="button"
                onClick={() => navigate("/owner/home")}
              >
                Go to Owner Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (meLoading || gymLoading) {
    return (
      <div className="od-app">
        <div className="od-loading">
          <div className="od-spinner" />
          <p>Loading members...</p>
        </div>
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className="od-app">
        <div className="od-container">
          <div className="om-block">
            <div className="om-empty">
              <div className="om-empty-icon">
                <AlertTriangle size={22} />
              </div>
              <h3>Access denied</h3>
              <p>You don’t have permission to manage memberships.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedGym) {
    return (
      <div className="od-app">
        <div className="od-container">
          <div className="om-block">
            <div className="om-empty">
              <div className="om-empty-icon">
                <Users size={22} />
              </div>
              <h3>Gym not found</h3>
              <p>You don’t have access to this gym.</p>
              <button
                className="om-btn primary"
                type="button"
                onClick={() => navigate("/owner/home")}
              >
                Go to Owner Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="od-app">
      <div className="od-container">
        <div className="od-hero-section">
          <div className="od-hero-background">
            <div className="od-hero-orb od-hero-orb-1" />
            <div className="od-hero-orb od-hero-orb-2" />
          </div>

          <div className="od-hero-content">
            <div className="od-hero-left">
              <div className="od-hero-greeting">
                <Users className="od-hero-pulse-icon" size={18} />
                <span>Membership Management</span>
              </div>
              <h1 className="od-hero-title">{selectedGym?.name || "Your Gym"}</h1>
              <p className="od-hero-subtitle">
                Review intents, manage active members, and track expirations.
              </p>

              <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                <button
                  className="om-btn"
                  type="button"
                  onClick={() => navigate(`/owner/view-gym/${selectedGymId}`)}
                >
                  View Gym
                </button>
                <button
                  className="om-btn"
                  type="button"
                  onClick={() => navigate(`/owner/edit-gym/${selectedGymId}`)}
                >
                  Edit Gym
                </button>
                <button
                  className="om-btn"
                  type="button"
                  onClick={() => navigate(`/owner/view-stats/${selectedGymId}`)}
                >
                  View Stats
                </button>
              </div>

              <div className="om-mode-switch">
                <label>View</label>
                <div className="om-mode-buttons">
                  <button
                    className={mode === "combined" ? "om-mode-btn active" : "om-mode-btn"}
                    type="button"
                    onClick={() => setMode("combined")}
                  >
                    <User size={16} /> All Members
                  </button>
                  <button
                    className={mode === "app" ? "om-mode-btn active" : "om-mode-btn"}
                    type="button"
                    onClick={() => setMode("app")}
                  >
                    <Users size={16} /> App Users
                  </button>
                </div>
              </div>
            </div>

            <div className="od-hero-quick-stats">
              <div className="od-hero-stat">
                <div className="od-hero-stat-icon views">
                  <CheckCircle2 size={20} />
                </div>
                <div className="od-hero-stat-content">
                  <span className="od-hero-stat-label">Current Tab</span>
                  <span className="od-hero-stat-value">{statusLabel(tab)}</span>
                </div>
              </div>

              <div className="od-hero-stat">
                <div className="od-hero-stat-icon rating">
                  <Users size={20} />
                </div>
                <div className="od-hero-stat-content">
                  <span className="od-hero-stat-label">Members Listed</span>
                  <span className="od-hero-stat-value">{filteredRows.length}</span>
                </div>
              </div>

              <div className="od-hero-stat">
                <div className="od-hero-stat-icon revenue">
                  <Calendar size={20} />
                </div>
                <div className="od-hero-stat-content">
                  <span className="od-hero-stat-label">Showing</span>
                  <span className="od-hero-stat-value">{showing}</span>
                </div>
              </div>

              <div className="od-hero-stat">
                <div className="od-hero-stat-icon rank">
                  <ArrowRight size={20} />
                </div>
                <div className="od-hero-stat-content">
                  <span className="od-hero-stat-label">Page</span>
                  <span className="od-hero-stat-value">
                    {page}/{totalPages}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="om-toolbar">
            <div className="om-tabs">
              <button
                className={tab === MEMBERSHIP_STATUS.INTENT ? "om-tab active" : "om-tab"}
                onClick={() => setTab(MEMBERSHIP_STATUS.INTENT)}
                type="button"
              >
                Intent
              </button>
              <button
                className={tab === MEMBERSHIP_STATUS.ACTIVE ? "om-tab active" : "om-tab"}
                onClick={() => setTab(MEMBERSHIP_STATUS.ACTIVE)}
                type="button"
              >
                Active
              </button>
              <button
                className={tab === MEMBERSHIP_STATUS.EXPIRED ? "om-tab active" : "om-tab"}
                onClick={() => setTab(MEMBERSHIP_STATUS.EXPIRED)}
                type="button"
              >
                Expired
              </button>
            </div>

            <div className="om-search">
              <Search size={18} />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search name, email, or contact..."
              />
              <button
                className="om-search-btn"
                type="button"
                onClick={() => {
                  setPage(1);
                  fetchList({ page: 1, q, status: tab });
                }}
                disabled={listLoading}
              >
                Search
              </button>
            </div>

            <div className="om-right-tools">
              <button
                className="om-add-member-btn"
                type="button"
                onClick={() => setAddManualOpen(true)}
              >
                <Plus size={18} /> Add Manual Member
              </button>

              <button
                className="om-btn warn"
                type="button"
                onClick={async () => {
                  try {
                    const r = await ownerExpireCheckGymMemberships(selectedGymId);
                    Swal.fire({
                      icon: "success",
                      title: "Checked expirations",
                      text: `${r?.expired_count ?? 0} membership(s) set to expired.`,
                    });
                    setPage(1);
                    fetchList({ page: 1, status: tab });
                  } catch (e) {
                    Swal.fire({
                      icon: "error",
                      title: "Expire check failed",
                      text: e?.response?.data?.message || e?.message || "Something went wrong",
                    });
                  }
                }}
              >
                <Calendar size={18} /> Check Expired
              </button>

              <select value={perPage} onChange={(e) => setPerPage(Number(e.target.value))}>
                {[10, 15, 20, 30, 50].map((n) => (
                  <option key={n} value={n}>
                    {n}/page
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="om-block">
          <div className="om-block-header">
            <h2>
              <Users size={18} /> Members
            </h2>
          </div>

          {listLoading ? (
            <div className="od-loading" style={{ minHeight: 260 }}>
              <div className="od-spinner" />
              <p>Loading list...</p>
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="om-empty">
              <div className="om-empty-icon">
                <Users size={22} />
              </div>
              <h3>No members here yet</h3>
              <p>Once users submit intent or you add manual members, they’ll show up here.</p>
            </div>
          ) : (
            <div className="om-table-wrap">
              <table className="om-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Source</th>
                    <th>Status</th>
                    <th>Start</th>
                    <th>End</th>
                    <th>Created</th>
                    <th className="om-actions-th">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((m) => {
                    const source = m.source || "app_user";
                    const isManual = source === "manual";

                    const name = isManual
                      ? (m.display_name ?? "-")
                      : (m.user?.name ?? m.display_name ?? "-");

                    const email = isManual
                      ? (m.email ?? "-")
                      : (m.user?.email ?? m.email ?? "-");

                    const sub = isManual
                      ? (m.contact_number ?? "Manual member")
                      : (m.user?.contact_number ?? m.contact_number ?? "App user");

                    const status = m.status;
                    const isIntent = status === MEMBERSHIP_STATUS.INTENT && !isManual;
                    const isActive = status === MEMBERSHIP_STATUS.ACTIVE && !isManual;

                    const membershipId = !isManual ? getMembershipId(m) : null;
                    const key = isManual ? `manual-${m.id}` : `app-${membershipId ?? "missing"}`;

                    return (
                      <tr key={key}>
                        <td>
                          <div className="om-member-cell">
                            <div className="om-avatar">{initials(name || email)}</div>
                            <div className="om-member-meta">
                              <strong title={name}>{name}</strong>
                              <span title={email}>{email}</span>
                              <small className="om-sub">{sub}</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={isManual ? "om-chip manual" : "om-chip app"}>
                            {isManual ? "Manual" : "App"}
                          </span>
                        </td>
                        <td>
                          <span className={badgeClass(status)}>{statusLabel(status)}</span>
                        </td>
                        <td>{formatDate(m.start_date)}</td>
                        <td>{formatDate(m.end_date)}</td>
                        <td>{formatDateTime(m.created_at)}</td>
                        <td className="om-actions-td">
                          <div className="om-actions">
                            <button className="om-btn" type="button" onClick={() => openEdit(m)}>
                              <Pencil size={16} /> Edit
                            </button>

                            {isIntent ? (
                              <>
                                <button
                                  className="om-btn primary"
                                  type="button"
                                  onClick={() => openActivate(m)}
                                >
                                  <CheckCircle2 size={16} /> Activate
                                </button>
                                <button
                                  className="om-btn danger"
                                  type="button"
                                  onClick={() => confirmAndUpdate(m, "reject")}
                                >
                                  <XCircle size={16} /> Reject
                                </button>
                              </>
                            ) : null}

                            {isActive ? (
                              <>
                                <button className="om-btn" type="button" onClick={() => openExtend(m)}>
                                  <TimerReset size={16} /> Extend
                                </button>
                                <button
                                  className="om-btn warn"
                                  type="button"
                                  onClick={() => confirmAndUpdate(m, "expire")}
                                >
                                  <Calendar size={16} /> Expire
                                </button>
                                <button
                                  className="om-btn danger"
                                  type="button"
                                  onClick={() => confirmAndUpdate(m, "cancel")}
                                >
                                  <Ban size={16} /> Cancel
                                </button>
                              </>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="om-pagination">
                <button
                  className="om-page-btn"
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Prev
                </button>
                <div className="om-page-meta">
                  Page <strong>{page}</strong> of <strong>{totalPages}</strong>
                </div>
                <button
                  className="om-page-btn"
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        <AddManualMemberModal
          open={addManualOpen}
          onClose={() => setAddManualOpen(false)}
          gymId={selectedGymId}
          onAdded={() => {
            setPage(1);
            fetchList({ page: 1, status: tab });
          }}
        />

        <Modal
          open={activateOpen}
          title="Activate Membership"
          subtitle="Set membership dates and optional details."
          onClose={closeActivate}
          actions={
            <>
              <div className="action-group">
                <button className="btn-secondary" type="button" onClick={closeActivate} disabled={aSaving}>
                  Close
                </button>
              </div>
              <div className="action-group">
                <button className="btn-primary" type="button" onClick={doActivate} disabled={aSaving}>
                  {aSaving ? <span className="btn-spinner" /> : <CheckCircle2 size={18} />}
                  Activate
                </button>
              </div>
            </>
          }
        >
          <div className="form-group">
            <label>
              Start date <span className="required">*</span>
            </label>
            <input className="form-input" type="date" value={aStart} onChange={(e) => setAStart(e.target.value)} />
          </div>
          <div className="form-group">
            <label>
              End date <span className="required">*</span>
            </label>
            <input className="form-input" type="date" value={aEnd} onChange={(e) => setAEnd(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Plan type</label>
            <input className="form-input" value={aPlan} onChange={(e) => setAPlan(e.target.value)} placeholder="Monthly / Annual / etc." />
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea className="form-input" value={aNotes} onChange={(e) => setANotes(e.target.value)} placeholder="Optional notes..." />
          </div>
        </Modal>

        <Modal
          open={extendOpen}
          title="Extend Membership"
          subtitle="Update the end date (and optional notes)."
          onClose={closeExtend}
          actions={
            <>
              <div className="action-group">
                <button className="btn-secondary" type="button" onClick={closeExtend} disabled={eSaving}>
                  Close
                </button>
              </div>
              <div className="action-group">
                <button className="btn-primary" type="button" onClick={doExtend} disabled={eSaving}>
                  {eSaving ? <span className="btn-spinner" /> : <Save size={18} />}
                  Save
                </button>
              </div>
            </>
          }
        >
          <div className="form-group">
            <label>Quick extend</label>
            <div className="om-quick-extend">
              <button
                type="button"
                className="om-btn"
                onClick={() => setEEnd((cur) => addToISODate(cur || isoToday(), { months: 1 }))}
              >
                +1 Month
              </button>
              <button
                type="button"
                className="om-btn"
                onClick={() => setEEnd((cur) => addToISODate(cur || isoToday(), { months: 3 }))}
              >
                +3 Months
              </button>
              <button
                type="button"
                className="om-btn"
                onClick={() => setEEnd((cur) => addToISODate(cur || isoToday(), { years: 1 }))}
              >
                +1 Year
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>
              New end date <span className="required">*</span>
            </label>
            <input className="form-input" type="date" value={eEnd} onChange={(e) => setEEnd(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea className="form-input" value={eNotes} onChange={(e) => setENotes(e.target.value)} placeholder="Optional notes..." />
          </div>
        </Modal>

        <Modal
          open={editOpen}
          title="Edit Member"
          subtitle="Update status, dates, and details."
          onClose={closeEdit}
          actions={
            <>
              <div className="action-group">
                <button className="btn-secondary" type="button" onClick={closeEdit} disabled={editSaving}>
                  Close
                </button>
              </div>
              <div className="action-group">
                <button className="btn-primary" type="button" onClick={doEditSave} disabled={editSaving}>
                  {editSaving ? <span className="btn-spinner" /> : <Save size={18} />}
                  Save
                </button>
              </div>
            </>
          }
        >
          {(editRow?.source || "app_user") === "manual" ? (
            <>
              <div className="form-group">
                <label>Full name</label>
                <input className="form-input" value={editFullName} onChange={(e) => setEditFullName(e.target.value)} />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input className="form-input" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
              </div>

              <div className="form-group">
                <label>Contact number</label>
                <input className="form-input" value={editContact} onChange={(e) => setEditContact(e.target.value)} />
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <label>Member</label>
                <input className="form-input" value={editFullName || ""} readOnly />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input className="form-input" value={editEmail || ""} readOnly />
              </div>
            </>
          )}

          <div className="form-group">
            <label>Status</label>
            <select className="form-input" value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
              <option value={MEMBERSHIP_STATUS.INTENT}>Intent</option>
              <option value={MEMBERSHIP_STATUS.ACTIVE}>Active</option>
              <option value={MEMBERSHIP_STATUS.EXPIRED}>Expired</option>
              <option value={MEMBERSHIP_STATUS.CANCELLED}>Cancelled</option>
              <option value={MEMBERSHIP_STATUS.REJECTED}>Rejected</option>
            </select>
          </div>

          <div className="form-group">
            <label>Start date</label>
            <input className="form-input" type="date" value={editStart} onChange={(e) => setEditStart(e.target.value)} />
          </div>
          <div className="form-group">
            <label>End date</label>
            <input className="form-input" type="date" value={editEnd} onChange={(e) => setEditEnd(e.target.value)} />
          </div>

          <div className="form-group">
            <label>Plan type</label>
            <input className="form-input" value={editPlan} onChange={(e) => setEditPlan(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea className="form-input" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} />
          </div>
        </Modal>
      </div>
    </div>
  );
}