export const divide = (x: bigint, y: bigint, roundUp: boolean): bigint => {
  if (roundUp) {
    if (x === 0n) {
      return 0n
    } else {
      return (x - 1n) / y + 1n
    }
  } else {
    return x / y
  }
}

export const lnWad = (x: bigint): bigint => {
  const or = (a: bigint, b: bigint) => a | b
  const xor = (a: bigint, b: bigint) => a ^ b
  const and = (a: bigint, b: bigint) => a & b
  const add = (a: bigint, b: bigint) => a + b
  const sub = (a: bigint, b: bigint) => a - b
  const mul = (a: bigint, b: bigint) => a * b
  const sdiv = (a: bigint, b: bigint) => a / b
  const lt = (a: bigint, b: bigint) => (a < b ? 1n : 0n)
  const shl = (x: bigint, y: bigint) => y << x
  const shr = (x: bigint, y: bigint) => y >> x
  const sar = (x: bigint, y: bigint) => y >> x
  const byte = (i: bigint, x: bigint) => (x >> (248n - i * 8n)) & 0xffn

  // We want to convert `x` from `10**18` fixed point to `2**96` fixed point.
  // We do this by multiplying by `2**96 / 10**18`. But since
  // `ln(x * C) = ln(x) + ln(C)`, we can simply do nothing here
  // and add `ln(2**96 / 10**18)` at the end.

  // Compute `k = log2(x) - 96`, `r = 159 - k = 255 - log2(x) = 255 ^ log2(x)`.
  let r = shl(7n, lt(0xffffffffffffffffffffffffffffffffn, x))
  r = or(r, shl(6n, lt(0xffffffffffffffffn, shr(r, x))))
  r = or(r, shl(5n, lt(0xffffffffn, shr(r, x))))
  r = or(r, shl(4n, lt(0xffffn, shr(r, x))))
  r = or(r, shl(3n, lt(0xffn, shr(r, x))))
  // forgefmt: disable-next-item
  r = xor(
    r,
    byte(
      and(0x1fn, shr(shr(r, x), 0x8421084210842108cc6318c6db6d54ben)),
      0xf8f9f9faf9fdfafbf9fdfcfdfafbfcfef9fafdfafcfcfbfefafafcfbffffffffn,
    ),
  )

  // Reduce range of x to (1, 2) * 2**96
  // ln(2^k * x) = k * ln(2) + ln(x)
  x = shr(159n, shl(r, x))

  // Evaluate using a (8, 8)-term rational approximation.
  // `p` is made monic, we will multiply by a scale factor later.
  // forgefmt: disable-next-item
  let p = sub(
    // This heavily nested expression is to avoid stack-too-deep for via-ir.
    sar(
      96n,
      mul(
        add(
          43456485725739037958740375743393n,
          sar(
            96n,
            mul(
              add(
                24828157081833163892658089445524n,
                sar(96n, mul(add(3273285459638523848632254066296n, x), x)),
              ),
              x,
            ),
          ),
        ),
        x,
      ),
    ),
    11111509109440967052023855526967n,
  )
  p = sub(sar(96n, mul(p, x)), 45023709667254063763336534515857n)
  p = sub(sar(96n, mul(p, x)), 14706773417378608786704636184526n)
  p = sub(mul(p, x), shl(96n, 795164235651350426258249787498n))
  // We leave `p` in `2**192` basis so we don't need to scale it back up for the division.

  // `q` is monic by convention.
  let q = add(5573035233440673466300451813936n, x)
  q = add(71694874799317883764090561454958n, sar(96n, mul(x, q)))
  q = add(283447036172924575727196451306956n, sar(96n, mul(x, q)))
  q = add(401686690394027663651624208769553n, sar(96n, mul(x, q)))
  q = add(204048457590392012362485061816622n, sar(96n, mul(x, q)))
  q = add(31853899698501571402653359427138n, sar(96n, mul(x, q)))
  q = add(909429971244387300277376558375n, sar(96n, mul(x, q)))

  // `p / q` is in the range `(0, 0.125) * 2**96`.

  // Finalization, we need to:
  // - Multiply by the scale factor `s = 5.549…`.
  // - Add `ln(2**96 / 10**18)`.
  // - Add `k * ln(2)`.
  // - Multiply by `10**18 / 2**96 = 5**18 >> 78`.

  // The q polynomial is known not to have zeros in the domain.
  // No scaling required because p is already `2**96` too large.
  p = sdiv(p, q)
  // Multiply by the scaling factor: `s * 5**18 * 2**96`, base is now `5**18 * 2**192`.
  p = mul(1677202110996718588342820967067443963516166n, p)
  // Add `ln(2) * k * 5**18 * 2**192`.
  // forgefmt: disable-next-item
  p = add(
    mul(
      16597577552685614221487285958193947469193820559219878177908093499208371n,
      sub(159n, r),
    ),
    p,
  )
  // Base conversion: mul `2**96 / (5**18 * 2**192)`.
  r = sdiv(p, 302231454903657293676544000000000000000000n)

  return r
}
