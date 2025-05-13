export type PermitSignature = {
  deadline: bigint
  v: number
  r: `0x${string}`
  s: `0x${string}`
}

export type ERC20PermitParam = {
  token: `0x${string}`
  permitAmount: bigint
  signature: PermitSignature
}
