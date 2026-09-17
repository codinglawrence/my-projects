import urllib.request, json, subprocess, os, sys

# Force UTF-8 output
sys.stdout.reconfigure(encoding='utf-8')

DOWNLOAD_DIR = r"C:\Users\terri\Desktop\Project\vibecoding-design-skills"
os.makedirs(DOWNLOAD_DIR, exist_ok=True)

# Search queries targeting vibe coding + design aesthetic + codex compatible
queries = [
    'vibe coding',
    'vibe coding design aesthetic',
    'codex skill design UI',
    'AGENTS.md design system',
    'vibe coding UI frontend beautiful',
    'codex design skill frontend',
    'awesome vibe coding',
    'design.md codex agent',
    'vibe coding template aesthetic',
    'codex skill UI UX design'
]

seen = set()
results = []

for q in queries:
    url = f'https://api.github.com/search/repositories?q={q.replace(" ", "+")}&sort=stars&order=desc&per_page=15'
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        resp = urllib.request.urlopen(req, timeout=15)
        data = json.loads(resp.read())
        for r in data.get('items', []):
            name = r['full_name']
            if name not in seen:
                seen.add(name)
                results.append({
                    'name': name,
                    'stars': r['stargazers_count'],
                    'desc': (r.get('description') or '')[:80],
                    'clone_url': r['clone_url'],
                    'html_url': r['html_url']
                })
        print(f"  [{q}] -> {len(data.get('items', []))} repos")
    except Exception as e:
        print(f"  [{q}] Error: {e}")

# Also add known repos from previous research
known_repos = [
    ('VoltAgent/awesome-design-md', 'Design system markdown files for AI agents'),
    ('openai/skills', 'OpenAI official Codex skills'),
    ('tangyuan-dev/awesome-vibe-coding', 'Awesome vibe coding collection'),
    ('techiediaries/awesome-vibe-coding', 'Awesome vibe coding resources'),
]
for name, desc in known_repos:
    if name not in seen:
        seen.add(name)
        results.append({
            'name': name,
            'stars': 0,
            'desc': desc,
            'clone_url': f'https://github.com/{name}.git',
            'html_url': f'https://github.com/{name}'
        })

results.sort(key=lambda x: x['stars'], reverse=True)

# Pick top 20
top20 = results[:20]

print(f"\n{'='*80}")
print(f"TOP 20 REPOS TO DOWNLOAD:")
print(f"{'='*80}")
for i, r in enumerate(top20, 1):
    print(f"{i:>2}. [{r['stars']:>6}] {r['name']}")
    print(f"    {r['desc']}")

# Clone each repo
print(f"\n{'='*80}")
print(f"STARTING DOWNLOADS...")
print(f"{'='*80}")

success = []
failed = []

for i, r in enumerate(top20, 1):
    repo_name = r['name'].replace('/', '_')
    target = os.path.join(DOWNLOAD_DIR, repo_name)
    print(f"\n[{i}/20] Cloning {r['name']}...")
    if os.path.exists(target):
        print(f"  -> Already exists, skipping")
        success.append(r)
        continue
    try:
        result = subprocess.run(
            ['git', 'clone', '--depth', '1', r['clone_url'], target],
            capture_output=True, text=True, timeout=120
        )
        if result.returncode == 0:
            print(f"  -> SUCCESS")
            success.append(r)
        else:
            print(f"  -> FAILED: {result.stderr[:100]}")
            failed.append(r)
    except subprocess.TimeoutExpired:
        print(f"  -> TIMEOUT")
        failed.append(r)
    except Exception as e:
        print(f"  -> ERROR: {e}")
        failed.append(r)

print(f"\n{'='*80}")
print(f"DOWNLOAD COMPLETE: {len(success)} success, {len(failed)} failed")
print(f"{'='*80}")

# Save report
report_path = os.path.join(DOWNLOAD_DIR, "DOWNLOAD_REPORT.md")
with open(report_path, 'w', encoding='utf-8') as f:
    f.write("# Vibe Coding 设计美学项目下载报告\n\n")
    f.write(f"下载目录: `{DOWNLOAD_DIR}`\n\n")
    f.write(f"总计: {len(success)} 成功 / {len(failed)} 失败\n\n")
    f.write("| # | 仓库 | Stars | 描述 | 状态 | 链接 |\n")
    f.write("|---|------|-------|------|------|------|\n")
    for i, r in enumerate(top20, 1):
        status = "✅ 已下载" if r in success else "❌ 失败"
        f.write(f"| {i} | {r['name']} | {r['stars']} | {r['desc']} | {status} | [GitHub]({r['html_url']}) |\n")

print(f"\nReport saved to: {report_path}")
