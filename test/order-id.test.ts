import { expect, test } from 'vitest'

import { fromOrderId } from '../src/entities/open-order/utils/order-id'

test('check fromOrderId function - 1', async () => {
  const { bookId, tick, index } =
    fromOrderId(
      53566444723624360785422944131996696091141564570442382186621897550883387867403n,
    )
  expect(bookId).toEqual(
    '2903842787083910905150096686205997338709207897290567260368',
  )
  expect(tick).toEqual(-259218)
  expect(index).toEqual(267)
})

test('check fromOrderId function - 2', async () => {
  const { bookId, tick, index } =
    fromOrderId(
      53566444723624360785422944131996696091141564570442382186622182562989005078795n,
    )
  expect(bookId).toEqual(
    '2903842787083910905150096686205997338709207897290567260368',
  )
  expect(tick).toEqual(-1)
  expect(index).toEqual(267)
})
