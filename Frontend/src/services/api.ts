const BASE_URL = '/api';

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

// Simple fetch wrapper
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    return await res.json();
  } catch (err) {
    console.error('API Error:', err);
    // fallback if server is dead
    return { success: false, message: 'Server unreachable' };
  }
}

export const api = {
  auth: {
    login: (username: string, password: string) =>
      request<any>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }),
    logout: () => request('/auth/logout', { method: 'POST' }),
  },

  users: {
    get: (params?: { role?: string; department_id?: number; team_id?: number }) => {
      const qs = new URLSearchParams();
      if (params?.role) qs.append('role', params.role);
      if (params?.department_id) qs.append('department_id', String(params.department_id));
      if (params?.team_id) qs.append('team_id', String(params.team_id));

      return request(`/users/get?${qs}`);
    },
    create: (data: any) =>
      request('/users/create', { method: 'POST', body: JSON.stringify(data) }),

    update: (id: number, data: any) =>
      request('/users/update', {
        method: 'POST',
        body: JSON.stringify({ id, ...data })
      }),

    delete: (id: number) =>
      request('/users/delete', { method: 'POST', body: JSON.stringify({ id }) }),
  },

  teams: {
    get: () => request('/teams/get'),

    create: (data: any) =>
      request('/teams/create', { method: 'POST', body: JSON.stringify(data) }),

    delete: (ids: number | number[]) => {
      const body = Array.isArray(ids) ? { ids } : { id: ids };
      return request('/teams/delete', { method: 'POST', body: JSON.stringify(body) });
    },
  },

  departments: {
    get: (params?: { team_id?: number }) => {
      const qs = params?.team_id ? `?team_id=${params.team_id}` : '';
      return request(`/departments/get${qs}`);
    },
    create: (data: any) =>
      request('/departments/create', { method: 'POST', body: JSON.stringify(data) }),

    update: (id: number, data: any) =>
      request('/departments/update', {
        method: 'POST',
        body: JSON.stringify({ id, ...data })
      }),

    delete: (id: number) =>
      request('/departments/delete', { method: 'POST', body: JSON.stringify({ id }) }),
  },

  events: {
    get: (params?: number | { team_id?: number | string; sort_by?: string; sort_order?: string }) => {
      const qs = new URLSearchParams();

      if (typeof params === 'number') {
        qs.append('team_id', String(params));
      } else if (params) {
        if (params.team_id && params.team_id !== 'all') qs.append('team_id', String(params.team_id));
        if (params.sort_by) qs.append('sort_by', params.sort_by);
        if (params.sort_order) qs.append('sort_order', params.sort_order);
      }

      return request(`/events/get?${qs}`);
    },
    create: (data: any) =>
      request('/events/create', { method: 'POST', body: JSON.stringify(data) }),

    update: (data: any) =>
      request('/events/update', { method: 'POST', body: JSON.stringify(data) }),

    delete: (id: number) =>
      request('/events/delete', { method: 'POST', body: JSON.stringify({ id }) }),
  },

  tasks: {
    get: (eventId?: number, assignedTo?: number, teamId?: number) => {
      const qs = new URLSearchParams();
      if (eventId) qs.append('event_id', String(eventId));
      if (assignedTo) qs.append('assigned_to', String(assignedTo));
      if (teamId) qs.append('team_id', String(teamId));

      return request(`/tasks/get?${qs}`);
    },
    create: (data: any) =>
      request('/tasks/create', { method: 'POST', body: JSON.stringify(data) }),

    update: (data: any) =>
      request('/tasks/update', { method: 'POST', body: JSON.stringify(data) }),

    assign: (data: { task_id: number; user_ids: number[] }) =>
      request('/tasks/assign', { method: 'POST', body: JSON.stringify(data) }),

    bulkUpdateStatus: (data: { task_ids: number[]; status: string }) =>
      request('/tasks/bulk_update_status', { method: 'POST', body: JSON.stringify(data) }),

    delete: (id: number) =>
      request('/tasks/delete', { method: 'POST', body: JSON.stringify({ id }) }),
  },

  messages: {
    get: (chatId: number, userId?: number, markRead?: boolean) => {
      const qs = new URLSearchParams({ chat_id: String(chatId) });
      if (userId) qs.append('user_id', String(userId));
      if (markRead) qs.append('mark_read', 'true');
      return request(`/messages/get?${qs}`);
    },
    send: (chatId: number, senderId: number, content: string) =>
      request('/messages/send', {
        method: 'POST',
        body: JSON.stringify({ chat_id: chatId, sender_id: senderId, content }),
      }),
  },

  chats: {
    get: (userId: number) =>
      request(`/chats/get?user_id=${userId}`),

    getById: (chatId: number) =>
      request(`/chats/get?chat_id=${chatId}`),

    create: (type: 'private' | 'group', participantIds: number[], name?: string, taskId?: number) =>
      request('/chats/create', {
        method: 'POST',
        body: JSON.stringify({
          type,
          participant_ids: participantIds,
          name,
          task_id: taskId
        }),
      }),

    init: (userId: number) =>
      request('/chats/init', { method: 'POST', body: JSON.stringify({ user_id: userId }) }),

    clear: (chatId: number, userId?: number) =>
      request('/chats/clear', {
        method: 'POST',
        body: JSON.stringify({ chat_id: chatId, user_id: userId }),
      }),
  }
};
