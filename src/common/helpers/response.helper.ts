

export const getMetaDataFromResponse = (response: any) => {
  return {
    ...(response?.total ? {total: response.total} : {}),
    ...(response?.page ? {page: response.page} : {}),
    ...(response?.limit ? {limit: response.limit} : {}),
    ...(response?.meta ?? {}),
  }
}