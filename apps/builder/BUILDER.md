
```bash
e2b template build --cpu-count 2 -n "vite-shadcn-template-builder-zepid" --memory-mb 4096 -c "cd /home/user/vite-shadcn-template-builder-zepid"
```

## 

### Docker Build command
```bash
docker buildx build --platform linux/amd64 -t vite-shadcn-template-builder-zepid:1.0.0 -f Dockerfile .
```

### Use the Daytona snapshot push command
```bash
daytona snapshot push vite-shadcn-template-builder-zepid:1.0.0 --entrypoint "bun run dev --host 0.0.0.0" --name vite-shadcn-template-builder-zepid:1.0.0 --cpu 2 --memory 4 --disk 1
```