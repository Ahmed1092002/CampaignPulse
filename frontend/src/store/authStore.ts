import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, Workspace, WorkspaceMembership } from '@/types';
import { getCookie, setCookie, deleteCookie } from 'cookies-next';
import { api } from '@/lib/api';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  workspaces: WorkspaceMembership[];
  currentWorkspace: Workspace | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setAuth: (data: { user: User; accessToken: string; refreshToken: string; workspaces: WorkspaceMembership[] }) => void;
  setUser: (user: User) => void;
  setWorkspaces: (workspaces: WorkspaceMembership[]) => void;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  switchWorkspace: (workspaceId: string) => Promise<void>;
  logout: () => void;
  updateTokens: (accessToken: string, refreshToken: string) => void;
  checkAuth: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      workspaces: [],
      currentWorkspace: null,
      isAuthenticated: false,
      isLoading: false,

      setAuth: ({ user, accessToken, refreshToken, workspaces }) => {
        setCookie('accessToken', accessToken, { maxAge: 60 * 15, path: '/', sameSite: 'lax' });
        setCookie('refreshToken', refreshToken, { maxAge: 60 * 60 * 24 * 7, path: '/', sameSite: 'lax' });
        setCookie('user', JSON.stringify(user), { maxAge: 60 * 60 * 24 * 30, path: '/', sameSite: 'lax' });

        api.client.defaults.headers.Authorization = `Bearer ${accessToken}`;

        set({
          user,
          accessToken,
          refreshToken,
          workspaces,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      setUser: (user) => {
        setCookie('user', JSON.stringify(user), { maxAge: 60 * 60 * 24 * 30, path: '/', sameSite: 'lax' });
        set({ user });
      },

      setWorkspaces: (workspaces) => {
        set({ workspaces });
      },

      setCurrentWorkspace: (workspace) => {
        if (workspace) {
          setCookie('workspaceId', workspace.id, { maxAge: 60 * 60 * 24 * 30, path: '/', sameSite: 'lax' });
          api.setWorkspaceId(workspace.id);
        } else {
          deleteCookie('workspaceId', { path: '/' });
          api.clearWorkspaceId();
        }
        set({ currentWorkspace: workspace });
      },

      switchWorkspace: async (workspaceId: string) => {
        const workspace = get().workspaces.find(w => w.workspace.id === workspaceId)?.workspace;
        if (workspace) {
          get().setCurrentWorkspace(workspace);
        }
      },

      logout: () => {
        deleteCookie('accessToken', { path: '/' });
        deleteCookie('refreshToken', { path: '/' });
        deleteCookie('user', { path: '/' });
        deleteCookie('workspaceId', { path: '/' });

        delete api.client.defaults.headers.Authorization;
        api.clearWorkspaceId();

        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          workspaces: [],
          currentWorkspace: null,
          isAuthenticated: false,
        });
      },

      updateTokens: (accessToken: string, refreshToken: string) => {
        setCookie('accessToken', accessToken, { maxAge: 60 * 15, path: '/', sameSite: 'lax' });
        setCookie('refreshToken', refreshToken, { maxAge: 60 * 60 * 24 * 7, path: '/', sameSite: 'lax' });

        api.client.defaults.headers.Authorization = `Bearer ${accessToken}`;

        set({ accessToken, refreshToken });
      },

      checkAuth: async () => {
        const accessToken = getCookie('accessToken');
        const refreshToken = getCookie('refreshToken');
        const userStr = getCookie('user');
        const workspaceId = getCookie('workspaceId');

        if (!accessToken || !refreshToken || !userStr) {
          get().logout();
          return false;
        }

        try {
          const user = JSON.parse(userStr as string);

          api.client.defaults.headers.Authorization = `Bearer ${accessToken}`;

          if (workspaceId) {
            api.setWorkspaceId(workspaceId as string);
          }

          set({
            user,
            accessToken: accessToken as string,
            refreshToken: refreshToken as string,
            isAuthenticated: true,
            isLoading: false,
          });

          return true;
        } catch {
          get().logout();
          return false;
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => ({
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      })),
      partialize: () => ({}),
    }
  )
);

if (typeof window !== 'undefined') {
  useAuthStore.getState().checkAuth();
}