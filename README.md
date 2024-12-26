# Plexy UI

This project is an alternative web ui for plex app. It tries to reflect a similar style as Netflix. I started the project after looking at the [PerPlexed](https://github.com/Ipmake/PerPlexed) project, which without it this project would not be possible.

So the major differences between this new one I'm working on and PerPlexed are:
1. Using **NextJS app router** instead of **React Router Dom**
2. Using **Shadcn component library** instead of **MUI**
3. Changed a bit of the ui screens and navigation between pages
4. You don't need to set the plex server uri (should make it so that you can connect to your server remotely)
5. Ability to **Mark as Watched** & **Mark as Unwatched**

I'm currently working on implementing:
1. The calls for **Mark as Watched** & **Mark as Unwatched** needs to be finished (the option is not available everywhere)
2. The link & page for whatever section (all the header title of the sliders are currently not clickable)

![Plexy UI](https://i.imgur.com/7vOadQ4.png)

The application is deployed on vercel and can be viewed for here https://plexy-eta.vercel.app/

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## WIP

This project was started recently and is a WIP (work in progress), thus you might find but in the application or interfaces that are not polished. If you find anything let me know via a github issue.