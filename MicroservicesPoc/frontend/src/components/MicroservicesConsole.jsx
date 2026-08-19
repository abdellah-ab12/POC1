import { useState, useEffect, useCallback } from "react";
import { Users, Package, Bell, Circle, Plus, Trash2, Send, Search, Pencil, Check, X, Loader2 } from "lucide-react";
import { usersApi, ordersApi, notificationsApi } from "../services/api";

const services = [
  { key: "users", label: "Users.Api", port: 5001, icon: Users },
  { key: "orders", label: "Orders.Api", port: 5002, icon: Package },
  { key: "notifications", label: "Notifications.Api", port: 5003, icon: Bell },
];

function shortId(id) {
  return id.slice(0, 8);
}
function fmtTime(iso) {
  return new Date(iso).toLocaleString("fr-FR", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" });
}

const rowAnim = { animation: "rowIn .28s ease-out" };

export default function MicroservicesConsole() {
  const [active, setActive] = useState("users");
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  const [userForm, setUserForm] = useState({ email: "", fullName: "" });
  const [orderForm, setOrderForm] = useState({ userId: "", productName: "", quantity: 1 });
  const [notifForm, setNotifForm] = useState({ recipientId: "", type: "OrderCreated", message: "" });
  const [orderError, setOrderError] = useState("");

  const [editingOrderId, setEditingOrderId] = useState(null);
  const [editDraft, setEditDraft] = useState({ productName: "", quantity: 1 });

  const [userQuery, setUserQuery] = useState("");
  const [orderQuery, setOrderQuery] = useState("");
  const [notifQuery, setNotifQuery] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setApiError("");
    try {
      const [usersData, ordersData] = await Promise.all([usersApi.list(), ordersApi.list()]);
      setUsers(usersData);
      setOrders(ordersData);
      if (usersData[0]) {
        setOrderForm((f) => ({ ...f, userId: f.userId || usersData[0].id }));
        setNotifForm((f) => ({ ...f, recipientId: f.recipientId || usersData[0].id }));
      }
    } catch (err) {
      setApiError(`Impossible de charger les données : ${err.message}. Vérifie que les 3 API tournent et que CORS est activé.`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function addUser(e) {
    e.preventDefault();
    if (!userForm.email || !userForm.fullName) return;
    try {
      const newUser = await usersApi.create(userForm);
      setUsers([newUser, ...users]);
      setUserForm({ email: "", fullName: "" });
    } catch (err) {
      setApiError(`POST /api/users a échoué : ${err.message}`);
    }
  }
  async function removeUser(id) {
    try {
      await usersApi.remove(id);
      setUsers(users.filter((u) => u.id !== id));
    } catch (err) {
      setApiError(`DELETE /api/users a échoué : ${err.message}`);
    }
  }

  async function addOrder(e) {
    e.preventDefault();
    setOrderError("");
    if (!orderForm.productName) return;
    try {
      const newOrder = await ordersApi.create({ ...orderForm, quantity: Number(orderForm.quantity) });
      setOrders([newOrder, ...orders]);
      setOrderForm((f) => ({ ...f, productName: "", quantity: 1 }));
    } catch (err) {
      setOrderError(err.message);
    }
  }
  async function removeOrder(id) {
    try {
      await ordersApi.remove(id);
      setOrders(orders.filter((o) => o.id !== id));
    } catch (err) {
      setApiError(`DELETE /api/orders a échoué : ${err.message}`);
    }
  }
  function startEditOrder(o) {
    setEditingOrderId(o.id);
    setEditDraft({ productName: o.productName, quantity: o.quantity });
  }
  async function saveEditOrder(id) {
    try {
      await ordersApi.update(id, { productName: editDraft.productName, quantity: Number(editDraft.quantity) });
      setOrders(orders.map((o) => (o.id === id ? { ...o, productName: editDraft.productName, quantity: Number(editDraft.quantity) } : o)));
      setEditingOrderId(null);
    } catch (err) {
      setApiError(`PUT /api/orders a échoué : ${err.message}`);
    }
  }

  async function addNotification(e) {
    e.preventDefault();
    if (!notifForm.message) return;
    try {
      await notificationsApi.create(notifForm);
      const localId = crypto.randomUUID ? crypto.randomUUID() : `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      setNotifications([{ id: localId, ...notifForm, status: "queued" }, ...notifications]);
      setNotifForm((f) => ({ ...f, message: "" }));
    } catch (err) {
      setApiError(`POST /api/notifications a échoué : ${err.message}`);
    }
  }
  function removeNotification(id) {
    setNotifications(notifications.filter((n) => n.id !== id));
  }

  const filteredUsers = users.filter(
    (u) => u.email.toLowerCase().includes(userQuery.toLowerCase()) || u.fullName.toLowerCase().includes(userQuery.toLowerCase())
  );
  const filteredOrders = orders.filter(
    (o) => o.productName.toLowerCase().includes(orderQuery.toLowerCase()) || shortId(o.userId).includes(orderQuery.toLowerCase())
  );
  const filteredNotifications = notifications.filter(
    (n) => n.message.toLowerCase().includes(notifQuery.toLowerCase()) || n.type.toLowerCase().includes(notifQuery.toLowerCase())
  );

  return (
    <div style={{ fontFamily: "var(--font-sans)" }} className="w-full min-h-[600px] flex rounded-xl overflow-hidden border border-[#2A2E35] bg-[#14161A] text-[#E8E6DE]">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jetbrains-mono/2.304/jetbrains-mono.css" />
      <style>{`
        @keyframes pulse-dot { 0%,100% { transform: scale(1); opacity: .6; } 50% { transform: scale(2); opacity: 0; } }
        @keyframes rowIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadePanel { from { opacity: 0; transform: translateY(3px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .console-row:hover { background: #1C2028; }
        .console-btn { transition: filter .15s ease, transform .1s ease; }
        .console-btn:hover { filter: brightness(1.08); }
        .console-btn:active { transform: scale(.97); }
        .console-btn:disabled { opacity: .5; cursor: not-allowed; }
        .icon-btn { transition: background .15s ease, transform .1s ease; }
        .icon-btn:hover { background: #262B33; }
        .nav-item { transition: background .15s ease, border-color .15s ease; }
        .spin { animation: spin 1s linear infinite; }
      `}</style>

      {/* Sidebar */}
      <div className="w-56 shrink-0 border-r border-[#2A2E35] bg-[#111318] flex flex-col">
        <div className="px-4 py-4 border-b border-[#2A2E35]">
          <div className="text-[11px] uppercase tracking-widest text-[#6B7078]">Practice console</div>
          <div className="text-[15px] font-medium mt-0.5">MicroservicesPoc</div>
        </div>
        <nav className="flex-1 py-2">
          {services.map((s) => {
            const Icon = s.icon;
            const isActive = active === s.key;
            return (
              <button
                key={s.key}
                onClick={() => setActive(s.key)}
                className="nav-item w-full flex items-center gap-2.5 px-4 py-3 text-left"
                style={{
                  background: isActive ? "#1C2028" : "transparent",
                  borderLeft: isActive ? "2px solid #3FB88B" : "2px solid transparent",
                }}
              >
                <Icon size={16} color={isActive ? "#3FB88B" : "#8A8F98"} aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px]" style={{ color: isActive ? "#E8E6DE" : "#B5B9C0" }}>{s.label}</div>
                  <div className="text-[11px] text-[#6B7078]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>:{s.port}</div>
                </div>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-[#3FB88B] opacity-60" style={{ animation: "pulse-dot 2s ease-in-out infinite" }} />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3FB88B]" />
                </span>
              </button>
            );
          })}
        </nav>
        <div className="px-4 py-3 border-t border-[#2A2E35] text-[11px] text-[#6B7078] flex items-center gap-1.5">
          <Circle size={7} fill="#3FB88B" color="#3FB88B" />
          3 services · live
        </div>
      </div>

      {/* Main panel */}
      <div key={active} className="flex-1 min-w-0 p-6 overflow-auto" style={{ animation: "fadePanel .2s ease-out" }}>
        {apiError && (
          <div className="mb-4 px-3 py-2 rounded-md text-[12px] flex items-start justify-between gap-3" style={{ background: "#2A1614", color: "#F09595", border: "1px solid #4A1B0C", ...rowAnim }}>
            <span>{apiError}</span>
            <button onClick={() => setApiError("")} aria-label="Fermer"><X size={14} /></button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-2 text-[13px] text-[#8A8F98]">
            <Loader2 size={16} className="spin" /> Chargement depuis les API…
          </div>
        ) : (
          <>
            {active === "users" && (
              <div>
                <PanelHeader title="Users.Api" subtitle="Gestion des utilisateurs · users_db" count={filteredUsers.length} total={users.length} query={userQuery} setQuery={setUserQuery} />
                <form onSubmit={addUser} className="flex gap-2 mb-5">
                  <input
                    placeholder="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    className="flex-1 bg-[#1C2028] border border-[#2A2E35] rounded-md px-3 py-2 text-[13px] outline-none focus:border-[#3FB88B]"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  />
                  <input
                    placeholder="fullName"
                    value={userForm.fullName}
                    onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })}
                    className="flex-1 bg-[#1C2028] border border-[#2A2E35] rounded-md px-3 py-2 text-[13px] outline-none focus:border-[#3FB88B]"
                  />
                  <button type="submit" className="console-btn flex items-center gap-1.5 px-3 py-2 rounded-md bg-[#3FB88B] text-[#0A1410] text-[13px] font-medium">
                    <Plus size={14} /> POST /api/users
                  </button>
                </form>
                <div className="border border-[#2A2E35] rounded-md overflow-hidden">
                  <div className="grid text-[11px] uppercase tracking-wide text-[#6B7078] bg-[#1C2028] px-3 py-2" style={{ gridTemplateColumns: "1fr 1.4fr 1.4fr 1fr 32px" }}>
                    <div>id</div><div>email</div><div>fullName</div><div>createdAt</div><div />
                  </div>
                  {filteredUsers.length === 0 && <Empty text="Aucun utilisateur" />}
                  {filteredUsers.map((u) => (
                    <div key={u.id} className="console-row grid px-3 py-2.5 text-[13px] border-t border-[#2A2E35] items-center" style={{ gridTemplateColumns: "1fr 1.4fr 1.4fr 1fr 32px", ...rowAnim }}>
                      <Mono>{shortId(u.id)}</Mono>
                      <div className="truncate">{u.email}</div>
                      <div className="truncate">{u.fullName}</div>
                      <Mono muted>{fmtTime(u.createdAt)}</Mono>
                      <button onClick={() => removeUser(u.id)} aria-label="Supprimer" className="icon-btn p-1.5 rounded-md justify-self-end">
                        <Trash2 size={14} color="#8A8F98" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {active === "orders" && (
              <div>
                <PanelHeader title="Orders.Api" subtitle="Commandes · orders_db · valide via Users.Api" count={filteredOrders.length} total={orders.length} query={orderQuery} setQuery={setOrderQuery} />
                <form onSubmit={addOrder} className="flex gap-2 mb-2 flex-wrap">
                  <select
                    value={orderForm.userId}
                    onChange={(e) => setOrderForm({ ...orderForm, userId: e.target.value })}
                    className="bg-[#1C2028] border border-[#2A2E35] rounded-md px-3 py-2 text-[13px] outline-none"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {users.map((u) => <option key={u.id} value={u.id}>{shortId(u.id)} — {u.fullName}</option>)}
                    <option value="00000000-0000-0000-0000-000000000000">00000000… (inconnu, pour tester le 400)</option>
                  </select>
                  <input
                    placeholder="productName"
                    value={orderForm.productName}
                    onChange={(e) => setOrderForm({ ...orderForm, productName: e.target.value })}
                    className="flex-1 bg-[#1C2028] border border-[#2A2E35] rounded-md px-3 py-2 text-[13px] outline-none focus:border-[#3FB88B]"
                  />
                  <input
                    type="number" min="1" value={orderForm.quantity}
                    onChange={(e) => setOrderForm({ ...orderForm, quantity: e.target.value })}
                    className="w-20 bg-[#1C2028] border border-[#2A2E35] rounded-md px-3 py-2 text-[13px] outline-none"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  />
                  <button type="submit" className="console-btn flex items-center gap-1.5 px-3 py-2 rounded-md bg-[#3FB88B] text-[#0A1410] text-[13px] font-medium">
                    <Plus size={14} /> POST /api/orders
                  </button>
                </form>
                {orderError && (
                  <div className="mb-4 px-3 py-2 rounded-md text-[12px]" style={{ background: "#2A1614", color: "#F09595", border: "1px solid #4A1B0C", ...rowAnim }}>
                    {orderError}
                  </div>
                )}
                <div className="border border-[#2A2E35] rounded-md overflow-hidden">
                  <div className="grid text-[11px] uppercase tracking-wide text-[#6B7078] bg-[#1C2028] px-3 py-2" style={{ gridTemplateColumns: "0.9fr 0.9fr 1.4fr 0.6fr 1fr 60px" }}>
                    <div>id</div><div>userId</div><div>produit</div><div>qté</div><div>createdAt</div><div />
                  </div>
                  {filteredOrders.length === 0 && <Empty text="Aucune commande" />}
                  {filteredOrders.map((o) => {
                    const isEditing = editingOrderId === o.id;
                    return (
                      <div key={o.id} className="console-row grid px-3 py-2.5 text-[13px] border-t border-[#2A2E35] items-center" style={{ gridTemplateColumns: "0.9fr 0.9fr 1.4fr 0.6fr 1fr 60px", ...rowAnim }}>
                        <Mono>{shortId(o.id)}</Mono>
                        <Mono muted>{shortId(o.userId)}</Mono>
                        {isEditing ? (
                          <input
                            value={editDraft.productName}
                            onChange={(e) => setEditDraft({ ...editDraft, productName: e.target.value })}
                            className="bg-[#14161A] border border-[#3FB88B] rounded px-2 py-1 text-[13px] outline-none"
                          />
                        ) : (
                          <div className="truncate">{o.productName}</div>
                        )}
                        {isEditing ? (
                          <input
                            type="number" min="1"
                            value={editDraft.quantity}
                            onChange={(e) => setEditDraft({ ...editDraft, quantity: e.target.value })}
                            className="bg-[#14161A] border border-[#3FB88B] rounded px-2 py-1 text-[13px] outline-none w-16"
                            style={{ fontFamily: "'JetBrains Mono', monospace" }}
                          />
                        ) : (
                          <span>{o.quantity}</span>
                        )}
                        <Mono muted>{fmtTime(o.createdAt)}</Mono>
                        <div className="flex items-center gap-1 justify-self-end">
                          {isEditing ? (
                            <>
                              <button onClick={() => saveEditOrder(o.id)} aria-label="Valider" className="icon-btn p-1.5 rounded-md"><Check size={14} color="#3FB88B" /></button>
                              <button onClick={() => setEditingOrderId(null)} aria-label="Annuler" className="icon-btn p-1.5 rounded-md"><X size={14} color="#8A8F98" /></button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => startEditOrder(o)} aria-label="Modifier" className="icon-btn p-1.5 rounded-md"><Pencil size={14} color="#8A8F98" /></button>
                              <button onClick={() => removeOrder(o.id)} aria-label="Supprimer" className="icon-btn p-1.5 rounded-md"><Trash2 size={14} color="#8A8F98" /></button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {active === "notifications" && (
              <div>
                <PanelHeader title="Notifications.Api" subtitle="File d'envoi (log console, pas de persistance)" count={filteredNotifications.length} total={notifications.length} query={notifQuery} setQuery={setNotifQuery} />
                <form onSubmit={addNotification} className="flex gap-2 mb-5 flex-wrap">
                  <select
                    value={notifForm.type}
                    onChange={(e) => setNotifForm({ ...notifForm, type: e.target.value })}
                    className="bg-[#1C2028] border border-[#2A2E35] rounded-md px-3 py-2 text-[13px] outline-none"
                  >
                    <option>OrderCreated</option>
                    <option>UserRegistered</option>
                  </select>
                  <input
                    placeholder="message"
                    value={notifForm.message}
                    onChange={(e) => setNotifForm({ ...notifForm, message: e.target.value })}
                    className="flex-1 bg-[#1C2028] border border-[#2A2E35] rounded-md px-3 py-2 text-[13px] outline-none focus:border-[#E8A33D]"
                  />
                  <button type="submit" className="console-btn flex items-center gap-1.5 px-3 py-2 rounded-md bg-[#E8A33D] text-[#2E1D02] text-[13px] font-medium">
                    <Send size={14} /> POST /api/notifications
                  </button>
                </form>
                <div className="space-y-2">
                  {filteredNotifications.length === 0 && <Empty text="Aucune notification envoyée cette session" />}
                  {filteredNotifications.map((n) => (
                    <div key={n.id} className="console-row px-3 py-2.5 rounded-md border border-[#2A2E35] bg-[#1C2028] flex items-start gap-3" style={rowAnim}>
                      <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded mt-0.5 shrink-0" style={{ background: "#2E2409", color: "#E8A33D" }}>{n.status}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px]">{n.message}</div>
                        <div className="text-[11px] text-[#6B7078] mt-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{n.type} → {shortId(n.recipientId)}</div>
                      </div>
                      <button onClick={() => removeNotification(n.id)} aria-label="Supprimer" className="icon-btn p-1.5 rounded-md shrink-0">
                        <Trash2 size={14} color="#8A8F98" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function PanelHeader({ title, subtitle, count, total, query, setQuery }) {
  return (
    <div className="flex items-start justify-between mb-5 gap-4 flex-wrap">
      <div>
        <h2 className="text-[16px] font-medium">{title}</h2>
        <div className="text-[12px] text-[#8A8F98] mt-0.5">{subtitle}</div>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative">
          <Search size={13} color="#6B7078" className="absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher…"
            className="bg-[#1C2028] border border-[#2A2E35] rounded-md pl-7 pr-2.5 py-1.5 text-[12px] outline-none focus:border-[#3FB88B] w-40"
          />
        </div>
        <div className="text-[11px] text-[#6B7078] whitespace-nowrap" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          {query ? `${count}/${total}` : `${total} enr.`}
        </div>
      </div>
    </div>
  );
}

function Empty({ text }) {
  return <div className="px-3 py-6 text-center text-[12px] text-[#6B7078]">{text}</div>;
}

function Mono({ children, muted }) {
  return <span style={{ fontFamily: "'JetBrains Mono', monospace", color: muted ? "#8A8F98" : "#E8E6DE" }}>{children}</span>;
}
