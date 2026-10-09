export interface GroupeMembreModel {
  id: string
  groupeId: string
  userId: string
  isGroupAdmin: boolean
  joinedAt: Date
}

export type CreateGroupeMembreModel = Omit<GroupeMembreModel, 'id' | 'joinedAt'>
export type UpdateGroupeMembreModel = Partial<
  Pick<GroupeMembreModel, 'isGroupAdmin'>
>
