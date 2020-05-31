import { Resolvers } from "../../../types/resolvers";
import {
  EmailSignInMutationArgs,
  EmailSignInResponse,
} from "../../../types/graph";
import User from "../../../entities/User";
import createJWT from "../../../utils/createJWT";

const resolvers: Resolvers = {
  Mutation: {
    EmailSignIn: async (
      _,
      args: EmailSignInMutationArgs
    ): Promise<EmailSignInResponse> => {
      const { email, password } = args;
      try {
        const user = await User.findOne({ email }).catch((err) => {
          console.log(err);
        });
        if (!user) {
          return {
            ok: false,
            error: "No User found with that email",
            token: null,
          };
        }
        const checkPassword = await user
          .comparePassword(password as string)
          .catch((err) => {
            console.log(err);
          });
        const token = createJWT(user.id);
        if (checkPassword) {
          return {
            ok: true,
            error: null,
            token,
          };
        } else {
          return {
            ok: false,
            error: "Wrong password",
            token: null,
          };
        }
      } catch (error) {
        return {
          ok: false,
          error: error.message,
          token: null,
        };
      }
    },
  },
};

export default resolvers;
