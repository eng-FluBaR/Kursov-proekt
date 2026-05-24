import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { AppMenu } from '@/components/app-menu';
import { PreviewHint } from '@/components/preview-hint';
import { useAuth } from '@/contexts/auth-context';
import { useAppTheme } from '@/contexts/theme-context';
import { apiRequest } from '@/lib/api';

type AdminUser = {
  id: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: string;
  jobCount: number;
  sessionCount: number;
};

type ShareUser = {
  id: string;
  email: string;
  role: 'admin' | 'user';
};

type ShareJob = {
  id: string;
  title: string;
  status: string;
  ownerId: string;
  ownerEmail: string | null;
  projectName: string | null;
  taskTypeName: string | null;
};

type SharePermission = {
  id: string;
  viewerId: string;
  jobId: string;
  grantorId: string;
  createdAt: string;
};

type TimeByType = {
  userEmail: string;
  taskTypeName: string | null;
  minutes: number;
  sessions: number;
};

type AdminStats = {
  totals: {
    users: number;
    projects: number;
    jobs: number;
    files: number;
    sessions: number;
  };
  timeByType: TimeByType[];
};

type JobSharesResponse = {
  users: ShareUser[];
  jobs: ShareJob[];
  permissions: SharePermission[];
  warning?: string | null;
};

function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

function shortDate(value: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: '2-digit', year: 'numeric' }).format(new Date(value));
}

function includesSearch(values: (string | number | null | undefined)[], search: string) {
  if (!search) {
    return true;
  }

  return values.some((value) => String(value ?? '').toLowerCase().includes(search));
}

export default function AdminScreen() {
  const { token, user } = useAuth();
  const { isDark } = useAppTheme();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [shareUsers, setShareUsers] = useState<ShareUser[]>([]);
  const [jobs, setJobs] = useState<ShareJob[]>([]);
  const [permissions, setPermissions] = useState<SharePermission[]>([]);
  const [timeByType, setTimeByType] = useState<TimeByType[]>([]);
  const [totals, setTotals] = useState<AdminStats['totals'] | null>(null);
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);
  const [selectedViewerIds, setSelectedViewerIds] = useState<string[]>([]);
  const [newPasswords, setNewPasswords] = useState<Record<string, string>>({});
  const [userSearch, setUserSearch] = useState('');
  const [jobSearch, setJobSearch] = useState('');
  const [shareJobSearch, setShareJobSearch] = useState('');
  const [shareUserSearch, setShareUserSearch] = useState('');
  const [reportSearch, setReportSearch] = useState('');
  const [status, setStatus] = useState('');
  const [shareWarning, setShareWarning] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isAdmin = Boolean(token && user?.role === 'admin');

  const selectedJobs = useMemo(
    () => jobs.filter((job) => selectedJobIds.includes(job.id)),
    [jobs, selectedJobIds],
  );

  const shareTargets = useMemo(() => {
    const selectedOwnerIds = new Set(selectedJobs.map((job) => job.ownerId));
    const selectedJobPermissions = permissions.filter((permission) => selectedJobIds.includes(permission.jobId));
    const alreadySharedByUser = new Map<string, number>();

    for (const permission of selectedJobPermissions) {
      alreadySharedByUser.set(permission.viewerId, (alreadySharedByUser.get(permission.viewerId) ?? 0) + 1);
    }

    return shareUsers.filter((shareUser) => {
      if (selectedJobIds.length === 0) {
        return true;
      }

      return !selectedOwnerIds.has(shareUser.id)
        || selectedJobs.some((job) => job.ownerId !== shareUser.id && (alreadySharedByUser.get(shareUser.id) ?? 0) < selectedJobIds.length);
    });
  }, [permissions, selectedJobIds, selectedJobs, shareUsers]);

  const filteredUsers = useMemo(() => {
    const search = userSearch.trim().toLowerCase();
    return users.filter((adminUser) =>
      includesSearch([adminUser.email, adminUser.role, adminUser.jobCount, adminUser.sessionCount], search),
    );
  }, [userSearch, users]);

  const filteredJobs = useMemo(() => {
    const search = jobSearch.trim().toLowerCase();
    return jobs.filter((job) =>
      includesSearch([job.title, job.ownerEmail, job.projectName, job.taskTypeName, job.status], search),
    );
  }, [jobSearch, jobs]);

  const filteredShareJobs = useMemo(() => {
    const search = shareJobSearch.trim().toLowerCase();
    return jobs.filter((job) =>
      includesSearch([job.title, job.ownerEmail, job.projectName, job.taskTypeName, job.status], search),
    );
  }, [jobs, shareJobSearch]);

  const filteredShareTargets = useMemo(() => {
    const search = shareUserSearch.trim().toLowerCase();
    return shareTargets.filter((shareUser) => includesSearch([shareUser.email, shareUser.role], search));
  }, [shareTargets, shareUserSearch]);

  const filteredReports = useMemo(() => {
    const search = reportSearch.trim().toLowerCase();
    return timeByType.filter((row) => includesSearch([row.userEmail, row.taskTypeName, row.sessions, row.minutes], search));
  }, [reportSearch, timeByType]);

  const loadAdminData = useCallback(async () => {
    if (!token || user?.role !== 'admin') {
      return;
    }

    setStatus('');
    setIsLoading(true);

    try {
      const [usersResponse, statsResponse, sharesResponse] = await Promise.all([
        apiRequest<{ users: AdminUser[] }>('/api/admin/users', { token }),
        apiRequest<AdminStats>('/api/admin/stats', { token }),
        apiRequest<JobSharesResponse>('/api/admin/job-shares', { token }),
      ]);

      setUsers(usersResponse.users);
      setTotals(statsResponse.totals);
      setTimeByType(statsResponse.timeByType);
      setShareUsers(sharesResponse.users);
      setJobs(sharesResponse.jobs);
      setPermissions(sharesResponse.permissions);
      setShareWarning(sharesResponse.warning ?? '');
    } catch (caughtError) {
      setStatus(caughtError instanceof Error ? caughtError.message : 'Could not load admin data.');
    } finally {
      setIsLoading(false);
    }
  }, [token, user?.role]);

  useFocusEffect(useCallback(() => {
    void loadAdminData();
  }, [loadAdminData]));

  async function updateRole(userId: string, role: 'admin' | 'user') {
    if (!token) {
      return;
    }

    try {
      await apiRequest(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        token,
        body: { role },
      });
      setStatus('Role updated.');
      await loadAdminData();
    } catch (caughtError) {
      setStatus(caughtError instanceof Error ? caughtError.message : 'Could not update role.');
    }
  }

  async function resetPassword(userId: string) {
    if (!token) {
      return;
    }

    const password = newPasswords[userId] ?? '';
    try {
      await apiRequest(`/api/admin/users/${userId}/password`, {
        method: 'PATCH',
        token,
        body: { password },
      });
      setStatus('Password reset.');
      setNewPasswords((current) => ({ ...current, [userId]: '' }));
    } catch (caughtError) {
      setStatus(caughtError instanceof Error ? caughtError.message : 'Could not reset password.');
    }
  }

  function confirmDeleteUser(adminUser: AdminUser) {
    Alert.alert(
      'Delete user',
      `Delete ${adminUser.email}? This also removes owned projects, jobs, and time entries.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => void deleteUser(adminUser.id) },
      ],
    );
  }

  async function deleteUser(userId: string) {
    if (!token) {
      return;
    }

    try {
      await apiRequest(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        token,
      });
      setStatus('User deleted.');
      await loadAdminData();
    } catch (caughtError) {
      setStatus(caughtError instanceof Error ? caughtError.message : 'Could not delete user.');
    }
  }

  function toggleSelectedJob(jobId: string) {
    setSelectedJobIds((current) => current.includes(jobId) ? current.filter((id) => id !== jobId) : [...current, jobId]);
  }

  function toggleSelectedViewer(userId: string) {
    setSelectedViewerIds((current) => current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId]);
  }

  async function grantAccess() {
    if (!token) {
      return;
    }

    if (selectedJobIds.length === 0 || selectedViewerIds.length === 0) {
      setStatus('Choose at least one task and at least one user.');
      return;
    }

    try {
      const responses = await Promise.all(selectedJobIds.map((jobId) =>
        apiRequest<{ results?: { status: string }[] }>('/api/admin/job-shares', {
          method: 'POST',
          token,
          body: { jobId, viewerIds: selectedViewerIds },
        }),
      ));

      const granted = responses.reduce((sum, response) => sum + (response.results?.filter((item) => item.status === 'granted').length ?? 0), 0);
      const total = responses.reduce((sum, response) => sum + (response.results?.length ?? 0), 0);
      const skipped = total - granted;

      setStatus(`${granted} access grant${granted === 1 ? '' : 's'} created${skipped > 0 ? `, ${skipped} skipped` : ''}.`);
      setSelectedJobIds([]);
      setSelectedViewerIds([]);
      await loadAdminData();
    } catch (caughtError) {
      setStatus(caughtError instanceof Error ? caughtError.message : 'Could not share selected tasks.');
    }
  }

  async function revokeAccess(permissionId: string) {
    if (!token) {
      return;
    }

    try {
      await apiRequest('/api/admin/job-shares', {
        method: 'DELETE',
        token,
        body: { permissionId },
      });
      setStatus('Task visibility removed.');
      await loadAdminData();
    } catch (caughtError) {
      setStatus(caughtError instanceof Error ? caughtError.message : 'Could not revoke access.');
    }
  }

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <AppMenu title="Admin" />
        <Text style={[styles.title, isDark && styles.textLight]}>Workspace administration</Text>
        <Text style={[styles.subtitle, isDark && styles.textMuted]}>
          Users, roles, passwords, task ownership, shared visibility, and team reporting.
        </Text>

        {!token ? <PreviewHint>Admin is available only after login with an admin account.</PreviewHint> : null}

        {!isAdmin ? (
          <TouchableOpacity style={styles.loginButton} onPress={() => router.push('/login')}>
            <Text style={styles.buttonText}>{token ? 'Admin account required' : 'Login as admin'}</Text>
          </TouchableOpacity>
        ) : null}

        {isAdmin ? (
          <>
            <TouchableOpacity style={[styles.secondaryButton, isDark && styles.secondaryButtonDark]} onPress={() => void loadAdminData()}>
              <Text style={[styles.secondaryButtonText, isDark && styles.textLight]}>Refresh admin data</Text>
            </TouchableOpacity>

            {isLoading ? <ActivityIndicator style={styles.loader} /> : null}
            {status ? <Text style={[styles.status, isDark && styles.statusDark]}>{status}</Text> : null}
            {shareWarning ? <Text style={[styles.warning, isDark && styles.warningDark]}>{shareWarning}</Text> : null}

            {totals ? (
              <View style={styles.grid}>
                {Object.entries(totals).map(([key, value]) => (
                  <View key={key} style={[styles.card, isDark && styles.cardDark]}>
                    <Text style={[styles.label, isDark && styles.textMuted]}>{key}</Text>
                    <Text style={[styles.value, isDark && styles.textLight]}>{value}</Text>
                  </View>
                ))}
                <View style={[styles.card, isDark && styles.cardDark]}>
                  <Text style={[styles.label, isDark && styles.textMuted]}>shared</Text>
                  <Text style={[styles.value, isDark && styles.textLight]}>{permissions.length}</Text>
                </View>
              </View>
            ) : null}

            <Section title="Registered users" detail={`Showing ${filteredUsers.length} of ${users.length}`} isDark={isDark}>
              <SearchInput value={userSearch} onChangeText={setUserSearch} placeholder="Search users, roles, jobs..." isDark={isDark} />
              {filteredUsers.map((adminUser) => (
                <View key={adminUser.id} style={[styles.itemCard, isDark && styles.itemCardDark]}>
                  <View style={styles.rowBetween}>
                    <View style={styles.flexOne}>
                      <Text style={[styles.itemTitle, isDark && styles.textLight]}>{adminUser.email}</Text>
                      <Text style={[styles.itemMeta, isDark && styles.textMuted]}>
                        {adminUser.role} | {adminUser.jobCount} jobs | {adminUser.sessionCount} sessions | {shortDate(adminUser.createdAt)}
                      </Text>
                    </View>
                    <Text style={[styles.rolePill, adminUser.role === 'admin' && styles.rolePillAdmin]}>{adminUser.role}</Text>
                  </View>

                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[styles.smallButton, adminUser.role === 'user' && styles.activeButton]}
                      onPress={() => void updateRole(adminUser.id, 'user')}
                    >
                      <Text style={[styles.smallButtonText, adminUser.role === 'user' && styles.activeButtonText]}>User</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.smallButton, adminUser.role === 'admin' && styles.activeButton]}
                      onPress={() => void updateRole(adminUser.id, 'admin')}
                    >
                      <Text style={[styles.smallButtonText, adminUser.role === 'admin' && styles.activeButtonText]}>Admin</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.passwordRow}>
                    <TextInput
                      style={[styles.input, styles.passwordInput, isDark && styles.inputDark]}
                      value={newPasswords[adminUser.id] ?? ''}
                      onChangeText={(value) => setNewPasswords((current) => ({ ...current, [adminUser.id]: value }))}
                      secureTextEntry
                      placeholder="New password"
                      placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                    />
                    <TouchableOpacity style={styles.smallDarkButton} onPress={() => void resetPassword(adminUser.id)}>
                      <Text style={styles.smallDarkButtonText}>Reset</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.dangerButton} onPress={() => confirmDeleteUser(adminUser)}>
                      <Text style={styles.dangerButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </Section>

            <Section title="Task owners" detail={`Showing ${filteredJobs.length} of ${jobs.length}`} isDark={isDark}>
              <SearchInput value={jobSearch} onChangeText={setJobSearch} placeholder="Search tasks, owners, projects..." isDark={isDark} />
              {filteredJobs.map((job) => (
                <View key={job.id} style={[styles.itemCard, isDark && styles.itemCardDark]}>
                  <Text style={[styles.itemTitle, isDark && styles.textLight]}>{job.title}</Text>
                  <Text style={[styles.itemMeta, isDark && styles.textMuted]}>
                    {job.ownerEmail ?? 'Unknown owner'} | {job.projectName ?? 'No project'} | {job.taskTypeName ?? 'No type'} | {job.status}
                  </Text>
                </View>
              ))}
            </Section>

            <Section
              title="Share task visibility"
              detail={`${selectedJobIds.length} tasks and ${selectedViewerIds.length} users selected`}
              isDark={isDark}
            >
              <Text style={[styles.subsectionTitle, isDark && styles.textLight]}>Tasks to share</Text>
              <SearchInput value={shareJobSearch} onChangeText={setShareJobSearch} placeholder="Search tasks to share..." isDark={isDark} />
              <View style={styles.selectionList}>
                {filteredShareJobs.map((job) => {
                  const selected = selectedJobIds.includes(job.id);
                  return (
                    <TouchableOpacity
                      key={job.id}
                      style={[styles.selectCard, selected && styles.selectCardActive, isDark && styles.selectCardDark]}
                      onPress={() => toggleSelectedJob(job.id)}
                    >
                      <View style={styles.flexOne}>
                        <Text style={[styles.itemTitle, isDark && styles.textLight]}>{job.title}</Text>
                        <Text style={[styles.itemMeta, isDark && styles.textMuted]}>{job.ownerEmail ?? 'Unknown owner'} | {job.status}</Text>
                      </View>
                      <Text style={[styles.checkMark, selected && styles.checkMarkActive]}>{selected ? 'Selected' : 'Select'}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.subsectionTitle, isDark && styles.textLight]}>Users to receive access</Text>
              <SearchInput value={shareUserSearch} onChangeText={setShareUserSearch} placeholder="Search users to share with..." isDark={isDark} />
              <View style={styles.selectionList}>
                {filteredShareTargets.map((shareUser) => {
                  const selected = selectedViewerIds.includes(shareUser.id);
                  return (
                    <TouchableOpacity
                      key={shareUser.id}
                      style={[styles.selectCard, selected && styles.selectCardActive, isDark && styles.selectCardDark]}
                      onPress={() => toggleSelectedViewer(shareUser.id)}
                    >
                      <View style={styles.flexOne}>
                        <Text style={[styles.itemTitle, isDark && styles.textLight]}>{shareUser.email}</Text>
                        <Text style={[styles.itemMeta, isDark && styles.textMuted]}>{shareUser.role}</Text>
                      </View>
                      <Text style={[styles.checkMark, selected && styles.checkMarkActive]}>{selected ? 'Selected' : 'Select'}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity style={styles.primaryButton} onPress={() => void grantAccess()}>
                <Text style={styles.primaryButtonText}>Share selected tasks</Text>
              </TouchableOpacity>

              <Text style={[styles.subsectionTitle, isDark && styles.textLight]}>Current shared access</Text>
              {permissions.length === 0 ? <Text style={[styles.emptyText, isDark && styles.textMuted]}>No shared tasks yet.</Text> : null}
              {permissions.map((permission) => {
                const viewer = shareUsers.find((item) => item.id === permission.viewerId);
                const job = jobs.find((item) => item.id === permission.jobId);
                return (
                  <View key={permission.id} style={[styles.itemCard, isDark && styles.itemCardDark]}>
                    <Text style={[styles.itemTitle, isDark && styles.textLight]}>{viewer?.email ?? 'Unknown user'}</Text>
                    <Text style={[styles.itemMeta, isDark && styles.textMuted]}>
                      Can view {job?.title ?? 'Unknown task'} from {job?.ownerEmail ?? 'unknown owner'}
                    </Text>
                    <TouchableOpacity style={[styles.smallDarkButton, styles.revokeButton]} onPress={() => void revokeAccess(permission.id)}>
                      <Text style={styles.smallDarkButtonText}>Revoke</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </Section>

            <Section title="Reporting" detail={`Showing ${filteredReports.length} grouped rows`} isDark={isDark}>
              <SearchInput value={reportSearch} onChangeText={setReportSearch} placeholder="Search user or task type..." isDark={isDark} />
              {filteredReports.map((row, index) => (
                <View key={`${row.userEmail}-${row.taskTypeName ?? 'none'}-${index}`} style={[styles.itemCard, isDark && styles.itemCardDark]}>
                  <Text style={[styles.itemTitle, isDark && styles.textLight]}>{row.userEmail}</Text>
                  <Text style={[styles.itemMeta, isDark && styles.textMuted]}>
                    {row.taskTypeName ?? 'No task type'} | {row.sessions} sessions | {formatMinutes(Number(row.minutes))}
                  </Text>
                </View>
              ))}
            </Section>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({
  title,
  detail,
  children,
  isDark,
}: {
  title: string;
  detail?: string;
  children: React.ReactNode;
  isDark: boolean;
}) {
  return (
    <View style={[styles.section, isDark && styles.sectionDark]}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, isDark && styles.textLight]}>{title}</Text>
        {detail ? <Text style={[styles.sectionDetail, isDark && styles.textMuted]}>{detail}</Text> : null}
      </View>
      {children}
    </View>
  );
}

function SearchInput({
  value,
  onChangeText,
  placeholder,
  isDark,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  isDark: boolean;
}) {
  return (
    <TextInput
      style={[styles.input, isDark && styles.inputDark]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  containerDark: { backgroundColor: '#020617' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  title: { color: '#111827', fontSize: 28, fontWeight: '900', marginTop: 8 },
  subtitle: { color: '#64748b', fontSize: 14, lineHeight: 20, marginBottom: 16, marginTop: 6 },
  loader: { marginVertical: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  card: { backgroundColor: '#f8fafc', borderColor: '#e5e7eb', borderRadius: 14, borderWidth: 1, minWidth: '30%', padding: 14 },
  cardDark: { backgroundColor: '#0f172a', borderColor: '#334155' },
  label: { color: '#64748b', fontSize: 12, fontWeight: '800', textTransform: 'capitalize' },
  value: { color: '#111827', fontSize: 24, fontWeight: '900', marginTop: 6 },
  section: { backgroundColor: '#f8fafc', borderColor: '#e5e7eb', borderRadius: 18, borderWidth: 1, marginTop: 16, padding: 14 },
  sectionDark: { backgroundColor: '#0b1220', borderColor: '#243244' },
  sectionHeader: { marginBottom: 12 },
  sectionTitle: { color: '#111827', fontSize: 19, fontWeight: '900' },
  sectionDetail: { color: '#64748b', fontSize: 12, marginTop: 4 },
  input: {
    backgroundColor: '#fff',
    borderColor: '#dbe3ef',
    borderRadius: 12,
    borderWidth: 1,
    color: '#111827',
    fontSize: 14,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  inputDark: { backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' },
  itemCard: { backgroundColor: '#fff', borderColor: '#e5e7eb', borderRadius: 14, borderWidth: 1, marginTop: 10, padding: 12 },
  itemCardDark: { backgroundColor: '#0f172a', borderColor: '#334155' },
  itemTitle: { color: '#111827', flexShrink: 1, fontSize: 15, fontWeight: '900' },
  itemMeta: { color: '#64748b', fontSize: 12, lineHeight: 17, marginTop: 4 },
  rowBetween: { alignItems: 'flex-start', flexDirection: 'row', gap: 10, justifyContent: 'space-between' },
  flexOne: { flex: 1, minWidth: 0 },
  rolePill: { backgroundColor: '#e0f2fe', borderRadius: 999, color: '#0369a1', fontSize: 11, fontWeight: '900', overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 5 },
  rolePillAdmin: { backgroundColor: '#dcfce7', color: '#166534' },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  smallButton: { borderColor: '#cbd5e1', borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 9 },
  smallButtonText: { color: '#334155', fontWeight: '900' },
  activeButton: { backgroundColor: '#22d3ee', borderColor: '#22d3ee' },
  activeButtonText: { color: '#083344' },
  passwordRow: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  passwordInput: { flex: 1, marginBottom: 0, minWidth: 150 },
  smallDarkButton: { backgroundColor: '#0f172a', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  smallDarkButtonText: { color: '#f8fafc', fontWeight: '900' },
  dangerButton: { backgroundColor: '#fee2e2', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  dangerButtonText: { color: '#991b1b', fontWeight: '900' },
  subsectionTitle: { color: '#111827', fontSize: 15, fontWeight: '900', marginTop: 12, marginBottom: 8 },
  selectionList: { gap: 8, marginBottom: 8 },
  selectCard: { alignItems: 'center', backgroundColor: '#fff', borderColor: '#e5e7eb', borderRadius: 14, borderWidth: 1, flexDirection: 'row', gap: 10, padding: 12 },
  selectCardDark: { backgroundColor: '#0f172a', borderColor: '#334155' },
  selectCardActive: { borderColor: '#22d3ee', borderWidth: 2 },
  checkMark: { color: '#64748b', fontSize: 12, fontWeight: '900' },
  checkMarkActive: { color: '#0891b2' },
  primaryButton: { alignItems: 'center', backgroundColor: '#22d3ee', borderRadius: 12, marginTop: 10, paddingVertical: 14 },
  primaryButtonText: { color: '#083344', fontWeight: '900' },
  revokeButton: { alignSelf: 'flex-start', marginTop: 10 },
  emptyText: { color: '#64748b', fontSize: 13 },
  status: { backgroundColor: '#eff6ff', borderRadius: 10, color: '#1d4ed8', marginBottom: 12, padding: 12 },
  statusDark: { backgroundColor: '#172554', color: '#bfdbfe' },
  warning: { backgroundColor: '#fffbeb', borderRadius: 10, color: '#92400e', marginBottom: 12, padding: 12 },
  warningDark: { backgroundColor: '#451a03', color: '#fde68a' },
  loginButton: { alignItems: 'center', backgroundColor: '#2563eb', borderRadius: 12, marginBottom: 12, paddingVertical: 14 },
  buttonText: { color: '#fff', fontWeight: '900' },
  secondaryButton: { alignItems: 'center', borderColor: '#cbd5e1', borderRadius: 12, borderWidth: 1, marginBottom: 12, paddingVertical: 12 },
  secondaryButtonDark: { borderColor: '#334155' },
  secondaryButtonText: { color: '#111827', fontWeight: '900' },
  textLight: { color: '#f8fafc' },
  textMuted: { color: '#94a3b8' },
});
