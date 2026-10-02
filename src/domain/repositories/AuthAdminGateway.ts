export interface AuthAdminGateway {
  deleteUser(userId: string): Promise<void>
}
