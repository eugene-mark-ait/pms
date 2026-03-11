import axios, { AxiosError } from "axios";

const baseURL =
  (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/api\/?$/, "") + "/api";

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  withCredentials: false,
});

const ACCESS_KEY = "pms_access_token";
const REFRESH_KEY = "pms_refresh_token";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(access: string, refresh: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
  document.cookie = "pms_session=1; path=/; max-age=604800; SameSite=Lax";
}

export function clearTokens() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  document.cookie = "pms_session=; path=/; max-age=0";
}

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    delete (config.headers as Record<string, unknown>)["Content-Type"];
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    const original = err.config as typeof err.config & { _retry?: boolean };
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = getRefreshToken();
      if (refresh) {
        try {
          const { data } = await axios.post<{ access: string }>(
            `${baseURL}/auth/refresh/`,
            { refresh }
          );
          const access = data.access;
          localStorage.setItem(ACCESS_KEY, access);
          if (original.headers) original.headers.Authorization = `Bearer ${access}`;
          return api(original);
        } catch {
          clearTokens();
          if (typeof window !== "undefined") window.location.href = "/login";
        }
      } else if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

// Types
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  is_staff?: boolean;
  role_names: string[];
  created_at: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface Lease {
  id: string;
  unit: { id: string; unit_number: string; property: { id: string; name: string } };
  tenant: User;
  monthly_rent: string;
  deposit_amount: string;
  deposit_paid: boolean;
  start_date: string;
  end_date: string;
  is_active: boolean;
  next_rent_due: string;
  outstanding_balance: string;
  payment_status: string;
  last_payment_date: string | null;
  can_pay_rent?: boolean;
  has_active_notice?: boolean;
  active_notice_move_out_date?: string | null;
  created_at: string;
}

/** Format amount as Kenyan Shillings (e.g. KSh 12,000). */
export function formatKSH(amount: string | number): string {
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  if (Number.isNaN(n)) return "KSh 0";
  return "KSh " + n.toLocaleString("en-KE", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

/** Display name for a user: "First Last" or email if no name. */
export function getDisplayName(user: { first_name?: string; last_name?: string; email?: string } | null | undefined): string {
  if (!user) return "—";
  const name = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
  return name || user.email || "—";
}

/** DRF PageNumberPagination response shape. */
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface Payment {
  id: string;
  lease?: Lease & { tenant?: User; unit?: { unit_number: string; property?: { name: string } } };
  amount: string;
  months_paid_for: number;
  period_start: string | null;
  period_end: string | null;
  payment_date: string;
  payment_method: string;
  payment_status: string;
  transaction_reference?: string;
  created_at: string;
}

export interface NotificationType {
  id: string;
  notification_type: string;
  title: string;
  body: string;
  read_at: string | null;
  created_at: string;
}
