export const getMetaDataFromResponse = (response: any) => {
  const hasPagination =
    response?.total != null &&
    response?.page != null &&
    response?.limit != null;

  if (!hasPagination) return response?.meta ?? {};

  return {
    total: response.total,
    page: response.page,
    limit: response.limit,
    totalPages:
      response.totalPages ?? Math.ceil(response.total / response.limit),
    ...(response?.meta ?? {}),
  };
};
