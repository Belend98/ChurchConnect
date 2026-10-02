export type ManagedAppRole = 'admin' | 'membre'

export interface RoleAdminGateway {
  changeUserRole(userId: string, role: ManagedAppRole): Promise<void>
}
