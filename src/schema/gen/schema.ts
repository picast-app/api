export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
};

export type Query = {
  __typename?: 'Query';
  search: Array<Podcast>;
  podcast?: Maybe<Podcast>;
  feed?: Maybe<Feed>;
};


export type QuerySearchArgs = {
  query: Scalars['String'];
  limit?: Maybe<Scalars['Int']>;
};


export type QueryPodcastArgs = {
  id: Scalars['Int'];
};


export type QueryFeedArgs = {
  url: Scalars['String'];
};

export type Feed = {
  __typename?: 'Feed';
  raw: Scalars['String'];
};

export type Podcast = {
  __typename?: 'Podcast';
  id: Scalars['Int'];
  title: Scalars['String'];
  author?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  episodes: Array<Episode>;
  artwork?: Maybe<Scalars['String']>;
  feed: Scalars['String'];
};

export type Episode = {
  __typename?: 'Episode';
  title: Scalars['String'];
  description?: Maybe<Scalars['String']>;
  publishDate?: Maybe<Scalars['String']>;
};
