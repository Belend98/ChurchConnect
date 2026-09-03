import { PredicationService } from '@/application/PredicationService'
import { SupabasePredicRepository } from '@/infrastructure/predication/SupabasePredicRepository'
import { SupabasePredicationAudioStorage } from '@/infrastructure/storage/SupabasePredicationAudioStorage'

const predicationRepository = new SupabasePredicRepository()
const predicationAudioStorage = new SupabasePredicationAudioStorage()

export const predicationService = new PredicationService(
  predicationRepository,
  predicationAudioStorage,
)
