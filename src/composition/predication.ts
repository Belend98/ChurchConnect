import { PredicationService } from '@/application/PredicationService'
import { authService } from '@/composition/auth'
import { SupabasePredicRepository } from '@/infrastructure/predication/SupabasePredicRepository'
import { SupabasePredicationFavoriteRepository } from '@/infrastructure/predication/SupabasePredicationFavoriteRepository'
import { SupabasePredicationLikeRepository } from '@/infrastructure/predication/SupabasePredicationLikeRepository'
import { SupabasePredicationAudioStorage } from '@/infrastructure/storage/SupabasePredicationAudioStorage'

const predicationRepository = new SupabasePredicRepository()
const predicationAudioStorage = new SupabasePredicationAudioStorage()
const predicationLikeRepository = new SupabasePredicationLikeRepository()
const predicationFavoriteRepository = new SupabasePredicationFavoriteRepository()

export const predicationService = new PredicationService(
  predicationRepository,
  predicationAudioStorage,
  predicationLikeRepository,
  predicationFavoriteRepository,
  authService,
)
