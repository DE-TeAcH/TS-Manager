const BASE_URL = 'http://localhost/PFE/Backend/api';

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const url = `${BASE_URL}${endpoint}`;
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API Request Error:', error);
    return {
      success: false,
      message: 'Network error or server unreachable.',
    };
  }
}

export const api = {
  auth: {
    login: (username: string, password: string) =>
      request<any>('/auth/login.php', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }),
    logout: () => request('/auth/logout.php', { method: 'POST' }),
  },
  users: {
    get: (params?: { role?: string; department_id?: number; team_id?: number }) => {
      const queryParams = new URLSearchParams();
      if (params?.role) queryParams.append('role', params.role);
      if (params?.department_id) queryParams.append('department_id', params.department_id.toString());
      if (params?.team_id) queryParams.append('team_id', params.team_id.toString());
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return request(`/users/get.php${query}`);
    },
    create: (userData: any) =>
      request('/users/create.php', {
        method: 'POST',
        body: JSON.stringify(userData),
      }),
    update: (id: number, userData: any) =>
      request('/users/update.php', {
        method: 'POST',
        body: JSON.stringify({ id, ...userData }),
      }),
    delete: (id: number) =>
      request('/users/delete.php', {
        method: 'POST',
        body: JSON.stringify({ id }),
      }),
  },
  teams: {
    get: () => request('/teams/get.php'),
    create: (teamData: any) =>
      request('/teams/create.php', {
        method: 'POST',
        body: JSON.stringify(teamData),
      }),
    delete: (ids: number | number[]) => {
      const body = Array.isArray(ids) ? { ids } : { id: ids };
      return request('/teams/delete.php', {
        method: 'POST',
        body: JSON.stringify(body),
      });
    },
  },
  departments: {
    get: (params?: { team_id?: number }) => {
      const query = params?.team_id ? `?team_id=${params.team_id}` : '';
      return request(`/departments/get.php${query}`);
    },
    create: (deptData: any) =>
      request('/departments/create.php', {
        method: 'POST',
        body: JSON.stringify(deptData),
      }),
    update: (id: number, deptData: any) =>
      request('/departments/update.php', {
        method: 'POST',
        body: JSON.stringify({ id, ...deptData }),
      }),
    delete: (id: number) =>
      request('/departments/delete.php', {
        method: 'POST',
        body: JSON.stringify({ id }),
      }),
  },
  events: {
    get: (params?: number | { team_id?: number | string; sort_by?: string; sort_order?: string }) => {
      const queryParams = new URLSearchParams();

      if (typeof params === 'number') {
        queryParams.append('team_id', params.toString());
      } else if (typeof params === 'object') {
        if (params.team_id && params.team_id !== 'all') queryParams.append('team_id', params.team_id.toString());
        if (params.sort_by) queryParams.append('sort_by', params.sort_by);
        if (params.sort_order) queryParams.append('sort_order', params.sort_order);
      }

      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return request(`/events/get.php${query}`);
    },
    create: (eventData: any) =>
      request('/events/create.php', {
        method: 'POST',
        body: JSON.stringify(eventData),
      }),
    update: (eventData: any) =>
      request('/events/update.php', {
        method: 'POST',
        body: JSON.stringify(eventData),
      }),
    delete: (id: number) =>
      request('/events/delete.php', {
        method: 'POST',
        body: JSON.stringify({ id }),
      }),
  },
  tasks: {
    get: (eventId?: number, assignedTo?: number, teamId?: number) => {
      const params = new URLSearchParams();
      if (eventId) params.append('event_id', eventId.toString());
      if (assignedTo) params.append('assigned_to', assignedTo.toString());
      if (teamId) params.append('team_id', teamId.toString());
      const query = params.toString() ? `?${params.toString()}` : '';
      return request(`/tasks/get.php${query}`);
    },
    create: (taskData: any) =>
      request('/tasks/create.php', {
        method: 'POST',
        body: JSON.stringify(taskData),
      }),
    update: (taskData: any) =>
      request('/tasks/update.php', {
        method: 'POST',
        body: JSON.stringify(taskData),
      }),
    assign: (data: { task_id: number; user_ids: number[] }) =>
      request('/tasks/assign.php', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    bulkUpdateStatus: (data: { task_ids: number[]; status: string }) =>
      request('/tasks/bulk_update_status.php', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      request('/tasks/delete.php', {
        method: 'POST',
        body: JSON.stringify({ id }),
      }),
  },
  messages: {
    get: (chatId: number, userId?: number, markRead?: boolean) => {
      const params = new URLSearchParams();
      params.append('chat_id', chatId.toString());
      if (userId) params.append('user_id', userId.toString());
      if (markRead) params.append('mark_read', 'true');
      return request(`/messages/get.php?${params.toString()}`);
    },
    send: (chatId: number, senderId: number, content: string) =>
      request('/messages/send.php', {
        method: 'POST',
        body: JSON.stringify({ chat_id: chatId, sender_id: senderId, content }),
      }),
  },
  chats: {
    get: (userId: number) => {
      const params = new URLSearchParams();
      params.append('user_id', userId.toString());
      return request(`/chats/get.php?${params.toString()}`);
    },
    getById: (chatId: number) => {
      return request(`/chats/get.php?chat_id=${chatId}`);
    },
    create: (type: 'private' | 'group', participantIds: number[], name?: string, taskId?: number) =>
      request('/chats/create.php', {
        method: 'POST',
        body: JSON.stringify({ type, participant_ids: participantIds, name, task_id: taskId }),
      }),
    init: (userId: number) =>
      request('/chats/init.php', {
        method: 'POST',
        body: JSON.stringify({ user_id: userId }),
      }),
    clear: (chatId: number, userId?: number) =>
      request('/chats/clear.php', {
        method: 'POST',
        body: JSON.stringify({ chat_id: chatId, user_id: userId }),
      }),
  }
};
