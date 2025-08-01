import { expect, test } from 'vitest'

import {
  fromOrderId,
  toOrderId,
} from '../../src/entities/open-order/utils/order-id'

test('check fromOrderId function - 1', async () => {
  const { bookId, tick, index } =
    fromOrderId(
      53566444723624360785422944131996696091141564570442382186621897550883387867403n,
    )
  expect(bookId).toEqual(
    2903842787083910905150096686205997338709207897290567260368n,
  )
  expect(tick).toEqual(-259218n)
  expect(index).toEqual(267n)

  expect(toOrderId(bookId, tick, index)).toEqual(
    53566444723624360785422944131996696091141564570442382186621897550883387867403n,
  )
})

test('check fromOrderId function - 2', async () => {
  const { bookId, tick, index } =
    fromOrderId(
      53566444723624360785422944131996696091141564570442382186622182562989005078795n,
    )
  expect(bookId).toEqual(
    2903842787083910905150096686205997338709207897290567260368n,
  )
  expect(tick).toEqual(-1n)
  expect(index).toEqual(267n)

  expect(toOrderId(bookId, tick, index)).toEqual(
    53566444723624360785422944131996696091141564570442382186622182562989005078795n,
  )
})
