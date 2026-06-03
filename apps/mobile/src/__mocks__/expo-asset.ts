export class Asset {
  static fromModule = jest.fn(() => {
    const asset = new Asset()
    asset.localUri = 'file://mock-font'
    asset.downloaded = true
    return asset
  })
  static loadAsync = jest.fn().mockResolvedValue([])
  downloadAsync = jest.fn(async function(this: Asset) {
    this.localUri = 'file://mock-font'
    this.downloaded = true
  })
  uri: string | null = null
  localUri: string | null = null
  width: number | null = null
  height: number | null = null
  downloaded = false
}
