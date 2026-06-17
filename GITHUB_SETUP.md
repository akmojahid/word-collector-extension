# Push to GitHub Instructions

Follow these steps to create your GitHub repository and push the code:

## Step 1: Create Repository on GitHub

1. Go to **https://github.com/new**
2. Fill in the details:
   - **Repository name:** `word-collector-extension`
   - **Description:** Chrome extension for collecting and organizing vocabulary words in Bangla, English, and phrases
   - **Visibility:** Public (so others can use it)
   - **Add .gitignore:** No (we already have one)
   - **Add license:** MIT License (recommended)
3. Click **"Create repository"**

## Step 2: Link Your Local Repository to GitHub

After creating the repo, GitHub will show you commands to push. Use these:

### If you have SSH key set up:
```bash
cd c:\Users\USER\Downloads\vocab-vault-extension\vocab-extension
git remote add origin git@github.com:YOUR_USERNAME/word-collector-extension.git
git branch -M main
git push -u origin main
```

### If you're using HTTPS (easier for first time):
```bash
cd c:\Users\USER\Downloads\vocab-vault-extension\vocab-extension
git remote add origin https://github.com/YOUR_USERNAME/word-collector-extension.git
git branch -M main
git push -u origin main
```

⚠️ **Replace `YOUR_USERNAME` with your actual GitHub username**

## Step 3: Authentication

When you run `git push`, you may be asked to authenticate:

### For HTTPS:
- GitHub will prompt you or open a browser login
- Or use a Personal Access Token:
  1. Go to GitHub → Settings → Developer settings → Personal access tokens
  2. Generate a new token with `repo` scope
  3. Use this token as your password when prompted

### For SSH:
- Set up SSH keys first: https://docs.github.com/en/authentication/connecting-to-github-with-ssh

## Step 4: Verify

Once pushed successfully:
1. Go to https://github.com/YOUR_USERNAME/word-collector-extension
2. You should see all your files
3. README.md will be displayed on the repo homepage
4. Share the link with others!

## Example Commands (Copy & Paste)

```bash
# Navigate to your extension folder
cd c:\Users\USER\Downloads\vocab-vault-extension\vocab-extension

# Add remote (use YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/word-collector-extension.git

# Rename branch to main
git branch -M main

# Push to GitHub
git push -u origin main
```

## Troubleshooting

**"Repository already exists" error?**
- Go to GitHub and create the repo with a different name
- Or delete the existing repo and create again

**Authentication failed?**
- Check your username and password
- For HTTPS, use a Personal Access Token instead of password
- For SSH, ensure your key is added to GitHub

**Push rejected?**
- Try: `git push --force origin main` (use carefully!)
- Or reset and try again

## What's Next?

✅ **Congratulations!** Your code is now public on GitHub.

Now you can:
- Share the link with others
- Accept pull requests for improvements
- Publish to Chrome Web Store (optional)
- Track issues and feature requests

---

Need help? Check GitHub's push guide: https://docs.github.com/en/get-started/importing-your-project-to-github/importing-a-repository-with-the-command-line
