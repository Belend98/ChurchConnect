import type { AuthService } from '@/application/services/AuthService'
import type { DeleteAccountUseCase } from '@/application/use cases/DeleteAccountUseCase'
import type { CreateProfilModel } from '@/domain/entités/Profil'
import type {
    ImageStorage,
    UploadImageInput,
} from '@/domain/repositories/ImageStorage'
import type { ProfilRepository } from '@/domain/repositories/ProfilRepository'

export type CreateProfileWithImageInput = CreateProfilModel & {
  imageFile: Omit<UploadImageInput, 'folder'>
}

export class ProfilService {
  constructor(
    private readonly profilRepository: ProfilRepository,
    private readonly authService: AuthService,
    private readonly imageStorage: ImageStorage,
    private readonly deleteAccountUseCase: DeleteAccountUseCase,
  ) {}

  createProfile(userId: string, data: CreateProfilModel) {
    return this.profilRepository.createProfile(userId, data)
  }

  async createProfileWithImage(
    userId: string,
    data: CreateProfileWithImageInput,
  ) {
    const { imageFile, ...profileData } = data
    const existingProfile = await this.profilRepository.getProfile(userId)
    const uploadedImage = await this.imageStorage.uploadImage({
      contentType: imageFile.contentType,
      fileName: imageFile.fileName,
      folder: `profiles/${userId}`,
      image: imageFile.image,
    })

    try {
      const profile = await this.profilRepository.createProfile(userId, {
        ...profileData,
        imageUrl: uploadedImage.publicUrl,
      })
      await this.deleteStoredImageQuietly(existingProfile?.imageUrl)
      return profile
    } catch (error) {
      await this.deleteStoredImageQuietly(uploadedImage.publicUrl)
      throw error
    }
  }

  getMyProfile(userId: string) {
    return this.profilRepository.getProfile(userId)
  }

  listCommunityMembers(limit?: number) {
    return this.profilRepository.listCommunityMembers(limit)
  }

  listProfilesByIds(ids: string[]) {
    return this.profilRepository.listByIds(ids)
  }

  async getCurrentUserProfileOrThrow() {
    const user = await this.authService.getCurrentUserOrThrow()
    const profile = await this.profilRepository.getProfile(user.id)

    if (!profile) throw new Error('Profil introuvable.')

    return {
      ...profile,
      email: user.email,
    }
  }

  async updateCurrentUserProfile(data: CreateProfilModel) {
    const userId = await this.authService.getCurrentUserIdOrThrow()
    return this.profilRepository.updateProfile(userId, data)
  }

  async deleteCurrentUserAccountData() {
    await this.deleteAccountUseCase.execute()
  }

  private async deleteStoredImageQuietly(imageUrl?: string): Promise<void> {
    if (!imageUrl) return

    const imagePath = this.imageStorage.getPathFromPublicUrl(imageUrl)

    if (!imagePath) return

    try {
      await this.imageStorage.deleteImage(imagePath)
    } catch (error) {
      console.warn(error)
    }
  }
}
