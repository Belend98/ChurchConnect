export interface GroupeModel {
  id: string
  name: string
  description?: string
  createdBy?: string
  createdAt: Date
}

export type CreateGroupeModel = Omit<GroupeModel, 'id' | 'createdAt'>
export type UpdateGroupeModel = Partial<Omit<CreateGroupeModel, 'createdBy'>>
