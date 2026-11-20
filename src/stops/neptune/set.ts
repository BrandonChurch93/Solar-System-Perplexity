import { createStandinSet } from '../../bodies/standin'
import type { SetFactory } from '../../core/types'
import { plan } from './plan'

export const createSet: SetFactory = (ctx) => createStandinSet(ctx, plan)
