
import { CACHE_TIME_DURATION } from "src/common/constants";
import { CacheConfigInterface } from "src/common/interfaces";


export const CacheConfiguration = (): CacheConfigInterface => ({
  enableCache: (process.env.ENABLE_CACHE === 'true'),
  cacheExpiredTime: +(process.env.CACHE_EXPIRED_TIME || CACHE_TIME_DURATION)
});