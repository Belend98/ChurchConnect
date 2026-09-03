import type {
  CreatePredicationModel,
  PredicationModel,
} from '@/domain/entités/Predication'
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

    return this.predicationRepository.create({
      categorieId: data.categorieId,
      title: data.title,
      durationSeconds: data.durationSeconds,
      mediaUrl: uploadedAudio.publicUrl,
    })
  }

  deletePredication(id: string): Promise<void> {
    return this.predicationRepository.delete(id)
  }
}
