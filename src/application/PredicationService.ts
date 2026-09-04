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

  updatePredication(
    id: string,
    data: UpdatePredicationModel,
  ): Promise<PredicationModel> {
    return this.predicationRepository.update(id, data)
  }

  async createPredicationWithAudio(
    data: CreatePredicationWithAudioInput,
  ): Promise<PredicationModel> {
    const uploadedAudio = await this.audioStorage.uploadAudio({
      fileName: data.fileName,
      contentType: data.contentType,
      audio: data.audio,
    })

    return this.predicationRepository.create({
      categorieId: data.categorieId,
      title: data.title,
      durationSeconds: data.durationSeconds,
      mediaUrl: uploadedAudio.publicUrl,
    })
  }

  async updatePredicationWithAudio(
    id: string,
    data: CreatePredicationWithAudioInput,
  ): Promise<PredicationModel> {
    const uploadedAudio = await this.audioStorage.uploadAudio({
      fileName: data.fileName,
      contentType: data.contentType,
      audio: data.audio,
    })

    return this.predicationRepository.update(id, {
      categorieId: data.categorieId,
      title: data.title,
      durationSeconds: data.durationSeconds,
      mediaUrl: uploadedAudio.publicUrl,
    })
  }

  deletePredication(id: string): Promise<void> {
    return this.predicationRepository.delete(id)
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
}
