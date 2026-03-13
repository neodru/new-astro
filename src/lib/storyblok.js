import { StoryblokClient } from "@storyblok/js";

export const storyblokClient = new StoryblokClient({
  accessToken: import.meta.env.STORYBLOK_API_TOKEN,
  cache: {
    type: "memory",
  },
});

export async function getStory(slug = "home") {
  const response = await storyblokClient.get(`cdn/stories/${slug}`);
  return response.data.story;
}
