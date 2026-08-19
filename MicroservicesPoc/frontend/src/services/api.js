const USERS_API = import.meta.env.VITE_USERS_API_URL;
const ORDERS_API = import.meta.env.VITE_ORDERS_API_URL;
const NOTIFICATIONS_API = import.meta.env.VITE_NOTIFICATIONS_API_URL;

async function handleResponse(res) {
  if (!res.ok) {
    let message = `Erreur ${res.status}`;
    try {
      const body = await res.json();
      if (body?.message) message = body.message;
    } catch {
      // pas de corps JSON, on garde le message générique
    }
    throw new Error(message);
  }
  if (res.status === 204) return null;
  return res.json();
}

const jsonHeaders = { "Content-Type": "application/json" };

export const usersApi = {
  list: () => fetch(`${USERS_API}/api/users`).then(handleResponse),
  create: (data) =>
    fetch(`${USERS_API}/api/users`, { method: "POST", headers: jsonHeaders, body: JSON.stringify(data) }).then(handleResponse),
  remove: (id) => fetch(`${USERS_API}/api/users/${id}`, { method: "DELETE" }).then(handleResponse),
};

export const ordersApi = {
  list: () => fetch(`${ORDERS_API}/api/orders`).then(handleResponse),
  create: (data) =>
    fetch(`${ORDERS_API}/api/orders`, { method: "POST", headers: jsonHeaders, body: JSON.stringify(data) }).then(handleResponse),
  update: (id, data) =>
    fetch(`${ORDERS_API}/api/orders/${id}`, { method: "PUT", headers: jsonHeaders, body: JSON.stringify(data) }).then(handleResponse),
  remove: (id) => fetch(`${ORDERS_API}/api/orders/${id}`, { method: "DELETE" }).then(handleResponse),
};

export const notificationsApi = {
  create: (data) =>
    fetch(`${NOTIFICATIONS_API}/api/notifications`, { method: "POST", headers: jsonHeaders, body: JSON.stringify(data) }).then(
      handleResponse
    ),
};
