import type { AuthService } from '@/application/AuthService'
import type { PredicationFavoriteModel } from '@/domain/entités/PredicationEngagement/PredicationFavorite'
import type {
  CreatePredicationModel,
  PredicationModel,
  UpdatePredicationModel,
} from '@/domain/entités/Predication'
import type { PredicationFavoriteRepository } from '@/domain/repositories/PredicationEngagement/PredicationFavoriteRepository'
import type { PredicationLikeRepository } from '@/domain/repositories/PredicationEngagement/PredicationLikeRepository'
import type {
  PredicationAudioStorage,
  UploadPredicationAudioInput,
} from '@/domain/repositories/PredicationAudioStorage'
import type { PredicationRepository } from '@/domain/repositories/PredicationRepository'

export type CreatePredicationWithAudioInput = Omit<
  CreatePredicationModel,
  'mediaUrl'
> &
  UploadPredicationAudioInput

export class PredicationService {
  constructor(
    private readonly predicationRepository: PredicationRepository,
    private readonly audioStorage: PredicationAudioStorage,
    private readonly likeRepository: PredicationLikeRepository,
    private readonly favoriteRepository: PredicationFavoriteRepository,
    private readonly authService: AuthService,
  ) {}

  listPredications(): Promise<PredicationModel[]> {
    return this.predicationRepository.list()
  }

  createPredication(data: CreatePredicationModel): Promise<PredicationModel> {
    return this.predicationRepository.create(data)
  }

  async createPredicationWithAudio(
    data: CreatePredicationWithAudioInput,
  ): Promise<PredicationModel> {
    const uploadedAudio = await this.audioStorage.uploadAudio({
      fileName: data.fileName,
      contentType: data.contentType,
      audio: data.audio,
    })

    try {
      return await this.predicationRepository.create({
        categorieId: data.categorieId,
        title: data.title,
        durationSeconds: data.durationSeconds,
        mediaUrl: uploadedAudio.publicUrl,
      })
    } catch (error) {
      await this.deleteStoredAudioQuietly(uploadedAudio.publicUrl)
      throw error
    }
  }

  async updatePredicationWithAudio(
    id: string,
    data: CreatePredicationWithAudioInput,
  ): Promise<PredicationModel> {
    const existingPredication = await this.predicationRepository.getById(id)
    const uploadedAudio = await this.audioStorage.uploadAudio({
      fileName: data.fileName,
      contentType: data.contentType,
      audio: data.audio,
    })

    try {
      const updatedPredication = await this.predicationRepository.update(id, {
        categorieId: data.categorieId,
        title: data.title,
        durationSeconds: data.durationSeconds,
        mediaUrl: uploadedAudio.publicUrl,
      })

      if (existingPredication?.mediaUrl !== uploadedAudio.publicUrl) {
        await this.deleteStoredAudioQuietly(existingPredication?.mediaUrl)
      }

      return updatedPredication
    } catch (error) {
      await this.deleteStoredAudioQuietly(uploadedAudio.publicUrl)
      throw error
    }
  }

  async updatePredication(
    id: string,
    data: UpdatePredicationModel,
  ): Promise<PredicationModel> {
    const existingPredication = await this.predicationRepository.getById(id)
    const updatedPredication = await this.predicationRepository.update(id, data)

    if (existingPredication?.mediaUrl !== updatedPredication.mediaUrl) {
      await this.deleteStoredAudioQuietly(existingPredication?.mediaUrl)
    }

    return updatedPredication
  }

  async deletePredication(id: string): Promise<void> {
    const existingPredication = await this.predicationRepository.getById(id)

    await this.predicationRepository.delete(id)
    await this.deleteStoredAudioQuietly(existingPredication?.mediaUrl)
  }

  async toggleLike(predicationId: string): Promise<boolean> {
    const userId = await this.authService.getCurrentUserIdOrThrow()
    const alreadyLiked = await this.likeRepository.exists(predicationId, userId)

    if (alreadyLiked) {
      await this.likeRepository.remove(predicationId, userId)
      return false
    }

    await this.likeRepository.add(predicationId, userId)
    return true
  }

  async toggleFavorite(predicationId: string): Promise<boolean> {
    const userId = await this.authService.getCurrentUserIdOrThrow()
    const alreadyFavorite = await this.favoriteRepository.exists(
      predicationId,
      userId,
    )

    if (alreadyFavorite) {
      await this.favoriteRepository.remove(predicationId, userId)
      return false
    }

    await this.favoriteRepository.add(predicationId, userId)
    return true
  }

  async isLikedByCurrentUser(predicationId: string): Promise<boolean> {
    const userId = await this.authService.getCurrentUserIdOrThrow()
    return this.likeRepository.exists(predicationId, userId)
  }

  async isFavoriteByCurrentUser(predicationId: string): Promise<boolean> {
    const userId = await this.authService.getCurrentUserIdOrThrow()
    return this.favoriteRepository.exists(predicationId, userId)
  }

  countLikes(predicationId: string): Promise<number> {
    return this.likeRepository.countByPredication(predicationId)
  }

  async listMyFavorites(): Promise<PredicationFavoriteModel[]> {
    const userId = await this.authService.getCurrentUserIdOrThrow()
    return this.favoriteRepository.listByUser(userId)
  }

  private async deleteStoredAudioQuietly(mediaUrl?: string): Promise<void> {
    if (!mediaUrl) return

    const audioPath = this.audioStorage.getPathFromPublicUrl(mediaUrl)

    if (!audioPath) return

    try {
      await this.audioStorage.deleteAudio(audioPath)
    } catch (error) {
      console.warn(error)
    }
  }
}
