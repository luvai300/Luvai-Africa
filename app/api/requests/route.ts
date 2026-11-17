// Legacy marketing forms have been retired. Existing enquiry records are retained.
export async function POST() {
  return Response.json(
    {
      error:
        "This form has been retired. Please contact the maker from a product listing.",
    },
    { status: 410 },
  );
}
