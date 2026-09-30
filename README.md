# Placement Portal (CDC L&D)

1. Supabase: create a project. SQL Editor: paste and run `schema.sql`.
2. Supabase > Authentication > Users > Add user (email + password) for each L&D team member. Turn off "Allow new users to sign up".
3. Supabase > Project Settings > API: copy the Project URL and the anon public key into the two constants at the top of the script in `index.html`.
4. Push `index.html` (and these files) to your GitHub repo. Repo Settings > Pages > deploy from the main branch. Open the link and log in.
