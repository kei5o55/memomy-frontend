// logic/case.ts

// Rails から届く snake_case のキーを、受け取り時に camelCase へ変換する
// （送信時はフロントの camelCase のまま送り、Rails 側で snake_case に変換している）

const toCamel = (key: string): string =>
  key.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());

export function keysToCamel<T>(value: unknown): T {
  if (Array.isArray(value)) {
    return value.map((v) => keysToCamel(v)) as T;
  }

  if (value !== null && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [toCamel(k), keysToCamel(v)])
    ) as T;
  }

  return value as T;
}

// fetch のレスポンスを JSON として読み、キーを camelCase に変換して返す
export const readJson = async <T>(response: Response): Promise<T> => keysToCamel<T>(await response.json());
