const privateResolver = (resolverFunction) => async (
  parent,
  args,
  context,
  info
) => {
  if (!context.req.user) {
    throw new Error("No JWT I refuse to proceed");
  }
  const resolved = await resolverFunction(parent, args, context, info).catch(
    (err) => {
      console.log(err);
    }
  );
  return resolved;
};

export default privateResolver;
