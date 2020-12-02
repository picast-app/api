import { AuthenticationError } from 'apollo-server-lambda'
import axios from 'axios'
import { signInToken, cookie } from '~/auth'

export const signInGoogle: Mutation<{ accessToken: string }> = async (
  parent,
  { accessToken },
  { setHeader }
) => {
  const { data } = await axios(
    'https://www.googleapis.com/oauth2/v3/userinfo',
    {
      params: { access_token: accessToken },
    }
  )

  if (!data.sub)
    throw new AuthenticationError("couldn't get user id from google")

  const jwt = signInToken(data.sub)

  setHeader('Set-Cookie', cookie('auth', jwt))
}
