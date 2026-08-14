<script lang="ts">
	import { onMount } from 'svelte';
	import { formatOklch, oklchToHex, parseOklch } from '$lib/theme/color';
	import { gamutOutline, place, spacePoints, SPACE_SCALE, type SpacePoint } from '$lib/theme/space';
	import { paletteOf, type Theme } from '$lib/theme/theme';
	import { cn } from '$lib/utils';

	interface Props {
		theme: Theme;
		mode: 'light' | 'dark';
		/** Shown when the webview has no WebGL to give. */
		unavailable: string;
		class?: string;
	}

	let { theme, mode, unavailable, class: className }: Props = $props();

	const { height: HEIGHT, chromaScale: CHROMA_SCALE } = SPACE_SCALE;
	/** Lightness steps the gamut slice is sampled at. */
	const SLICE_STEPS = 64;
	const RADIUS = 0.075;

	const points = $derived(spacePoints(theme, mode));

	/** The hue the gamut is cut at: the brand colour's, because that is the one being judged. */
	const sliceHue = $derived(parseOklch(paletteOf(theme, mode).primary ?? '')?.h ?? 0);

	interface Scene {
		setPoints: (next: SpacePoint[]) => void;
		setSlice: (hue: number) => void;
		dispose: () => void;
	}

	let host = $state<HTMLDivElement | null>(null);
	let hovered = $state<SpacePoint | null>(null);
	let failed = $state(false);
	let scene = $state<Scene | null>(null);

	onMount(() => {
		if (!host) return;
		const container = host;
		let cancelled = false;

		// three is a third of the bundle and only this view needs it, so it is fetched when the view
		// is opened rather than on the way to the gallery.
		void import('three')
			.then((THREE) => {
				if (cancelled) return;
				scene = build(THREE, container);
			})
			.catch(() => (failed = true));

		return () => {
			cancelled = true;
			scene?.dispose();
			scene = null;
		};
	});

	// Both are rebuilt whenever the palette moves, which is what makes a slider visibly push its
	// token across the space rather than quietly rewrite a number.
	$effect(() => {
		scene?.setPoints(points);
	});

	$effect(() => {
		scene?.setSlice(sliceHue);
	});

	function build(THREE: typeof import('three'), container: HTMLDivElement): Scene | null {
		let renderer: import('three').WebGLRenderer;
		try {
			renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
		} catch {
			failed = true;
			return null;
		}

		const canvas = renderer.domElement;
		renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
		canvas.style.display = 'block';
		canvas.style.width = '100%';
		canvas.style.height = '100%';
		canvas.style.cursor = 'grab';
		canvas.style.touchAction = 'none';
		container.appendChild(canvas);

		const world = new THREE.Scene();
		const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);

		// The model is turned rather than the camera flown around it: the lightness axis has to stay
		// upright, which an unconstrained orbit does not guarantee.
		const model = new THREE.Group();
		world.add(model);

		world.add(new THREE.AmbientLight(0xffffff, 2.1));
		const key = new THREE.DirectionalLight(0xffffff, 1.6);
		key.position.set(3, 5, 4);
		world.add(key);
		const fill = new THREE.DirectionalLight(0xffffff, 0.5);
		fill.position.set(-4, -2, -3);
		world.add(fill);

		const ball = new THREE.SphereGeometry(1, 24, 16);
		const shared: { dispose: () => void }[] = [ball];

		const guide = new THREE.LineBasicMaterial({
			color: 0x808080,
			transparent: true,
			opacity: 0.35
		});
		shared.push(guide);

		const axis = new THREE.BufferGeometry().setFromPoints([
			new THREE.Vector3(0, -HEIGHT / 2, 0),
			new THREE.Vector3(0, HEIGHT / 2, 0)
		]);
		shared.push(axis);
		model.add(new THREE.Line(axis, guide));

		for (const lightness of [0.25, 0.5, 0.75]) {
			const ring: import('three').Vector3[] = [];
			const radius = 0.32 * CHROMA_SCALE;
			for (let step = 0; step <= 72; step += 1) {
				const angle = (step / 72) * Math.PI * 2;
				const y = (lightness - 0.5) * HEIGHT;
				ring.push(new THREE.Vector3(radius * Math.cos(angle), y, radius * Math.sin(angle)));
			}
			const geometry = new THREE.BufferGeometry().setFromPoints(ring);
			shared.push(geometry);
			model.add(new THREE.Line(geometry, guide));
		}

		/**
		 * The sRGB gamut, cut through the brand hue and its opposite.
		 *
		 * `fitToSrgb` binary-searches the chroma sRGB can still show at a lightness — which is exactly
		 * the outline of that cut. It is the shape every article about OKLCH draws by hand and none of
		 * them let you put your own colours inside.
		 */
		const sliceMaterial = new THREE.MeshBasicMaterial({
			vertexColors: true,
			transparent: true,
			opacity: 0.72,
			side: THREE.DoubleSide,
			depthWrite: false
		});
		shared.push(sliceMaterial);

		let slice: import('three').Mesh | null = null;

		const setSlice = (hue: number): void => {
			if (slice) {
				model.remove(slice);
				slice.geometry.dispose();
			}

			const vertices: number[] = [];
			const colours: number[] = [];
			const scratch = new THREE.Color();

			const corner = (lightness: number, chroma: number, h: number) => {
				const radians = (h * Math.PI) / 180;
				const radius = chroma * CHROMA_SCALE;
				vertices.push(
					radius * Math.cos(radians),
					(lightness - 0.5) * HEIGHT,
					radius * Math.sin(radians)
				);
				scratch.setStyle(oklchToHex({ l: lightness, c: chroma, h, alpha: 1 }));
				colours.push(scratch.r, scratch.g, scratch.b);
			};

			for (const side of [hue, (hue + 180) % 360]) {
				const edges = gamutOutline(side, SLICE_STEPS);

				for (let step = 0; step < SLICE_STEPS; step += 1) {
					const low = step / SLICE_STEPS;
					const high = (step + 1) / SLICE_STEPS;
					const cl = edges[step] ?? 0;
					const ch = edges[step + 1] ?? 0;

					corner(low, 0, side);
					corner(low, cl, side);
					corner(high, 0, side);

					corner(low, cl, side);
					corner(high, ch, side);
					corner(high, 0, side);
				}
			}

			const geometry = new THREE.BufferGeometry();
			geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
			geometry.setAttribute('color', new THREE.Float32BufferAttribute(colours, 3));
			slice = new THREE.Mesh(geometry, sliceMaterial);
			model.add(slice);
		};

		interface Node {
			mesh: import('three').Mesh;
			material: import('three').MeshStandardMaterial;
			point: SpacePoint;
			from: [number, number, number];
			to: [number, number, number];
		}

		let nodes: Node[] = [];
		let meshes: import('three').Mesh[] = [];
		let travel = 1;

		const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

		const setPoints = (next: SpacePoint[]): void => {
			const previous = new Map(nodes.map((node) => [node.point.token, node.to]));

			for (const node of nodes) {
				model.remove(node.mesh);
				node.material.dispose();
			}

			nodes = next.map((point) => {
				const solid = point.hex;
				const material = new THREE.MeshStandardMaterial({
					roughness: 0.32,
					metalness: 0,
					transparent: point.colour.alpha < 1,
					opacity: point.colour.alpha
				});
				material.color.setStyle(solid);
				// A near-black token would otherwise be a hole rather than a sphere; a little of its own
				// colour back through the emissive keeps it round without washing the hue out.
				material.emissive.setStyle(solid);
				material.emissiveIntensity = 0.18;

				const mesh = new THREE.Mesh(ball, material);
				mesh.scale.setScalar(RADIUS);

				const to = place(point.colour);
				const from = previous.get(point.token) ?? to;
				mesh.position.set(...from);
				model.add(mesh);

				return { mesh, material, point, from, to };
			});

			meshes = nodes.map((node) => node.mesh);
			hoverTarget = null;
			hovered = null;
			travel = reduced ? 1 : 0;
		};

		let azimuth = 0.7;
		let elevation = 0.42;
		let distance = 5.6;
		let spinning = true;
		let dragging = false;
		let lastX = 0;
		let lastY = 0;

		const raycaster = new THREE.Raycaster();
		const pointer = new THREE.Vector2(2, 2);
		let hoverTarget: import('three').Mesh | null = null;

		const onPointerDown = (event: PointerEvent) => {
			dragging = true;
			spinning = false;
			lastX = event.clientX;
			lastY = event.clientY;
			canvas.setPointerCapture(event.pointerId);
			canvas.style.cursor = 'grabbing';
		};

		const onPointerUp = (event: PointerEvent) => {
			dragging = false;
			canvas.releasePointerCapture(event.pointerId);
			canvas.style.cursor = 'grab';
		};

		const onPointerMove = (event: PointerEvent) => {
			const rect = canvas.getBoundingClientRect();
			pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
			pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
			if (!dragging) return;

			azimuth -= (event.clientX - lastX) * 0.008;
			// Stopped short of the poles: straight down flips the up-vector and the model starts
			// spinning on its own axis under the cursor.
			elevation = Math.max(-1.35, Math.min(1.35, elevation + (event.clientY - lastY) * 0.006));
			lastX = event.clientX;
			lastY = event.clientY;
		};

		const onWheel = (event: WheelEvent) => {
			event.preventDefault();
			distance = Math.max(3.4, Math.min(11, distance + event.deltaY * 0.004));
		};

		const onLeave = () => {
			pointer.set(2, 2);
		};

		canvas.addEventListener('pointerdown', onPointerDown);
		canvas.addEventListener('pointerup', onPointerUp);
		canvas.addEventListener('pointermove', onPointerMove);
		canvas.addEventListener('pointerleave', onLeave);
		canvas.addEventListener('wheel', onWheel, { passive: false });

		const fit = () => {
			const { clientWidth, clientHeight } = container;
			if (clientWidth === 0 || clientHeight === 0) return;
			renderer.setSize(clientWidth, clientHeight, false);
			camera.aspect = clientWidth / clientHeight;
			camera.updateProjectionMatrix();
		};

		// Once here and then on every change: an observer's first callback arrives with the next
		// rendering step, and a window that is not compositing never takes one — the canvas would sit
		// at its default 300×150 for as long as it stayed hidden.
		fit();
		const resize = new ResizeObserver(fit);
		resize.observe(container);

		let frame = 0;
		let previous = performance.now();
		const ease = (t: number) => 1 - Math.pow(1 - t, 3);

		const render = (now: number) => {
			frame = requestAnimationFrame(render);
			const delta = Math.min(0.05, (now - previous) / 1000);
			previous = now;

			if (spinning && !reduced) azimuth += delta * 0.22;

			if (travel < 1) {
				travel = Math.min(1, travel + delta / 0.45);
				const t = ease(travel);
				for (const node of nodes) {
					node.mesh.position.set(
						node.from[0] + (node.to[0] - node.from[0]) * t,
						node.from[1] + (node.to[1] - node.from[1]) * t,
						node.from[2] + (node.to[2] - node.from[2]) * t
					);
				}
			}

			camera.position.set(
				distance * Math.cos(elevation) * Math.sin(azimuth),
				distance * Math.sin(elevation),
				distance * Math.cos(elevation) * Math.cos(azimuth)
			);
			camera.lookAt(0, 0, 0);

			raycaster.setFromCamera(pointer, camera);
			const mesh = (raycaster.intersectObjects(meshes, false)[0]?.object ?? null) as
				import('three').Mesh | null;

			if (mesh !== hoverTarget) {
				hoverTarget?.scale.setScalar(RADIUS);
				mesh?.scale.setScalar(RADIUS * 1.7);
				hoverTarget = mesh;
				hovered = nodes.find((node) => node.mesh === mesh)?.point ?? null;
			}

			renderer.render(world, camera);
		};

		frame = requestAnimationFrame(render);

		return {
			setPoints,
			setSlice,
			dispose: () => {
				cancelAnimationFrame(frame);
				resize.disconnect();
				canvas.removeEventListener('pointerdown', onPointerDown);
				canvas.removeEventListener('pointerup', onPointerUp);
				canvas.removeEventListener('pointermove', onPointerMove);
				canvas.removeEventListener('pointerleave', onLeave);
				canvas.removeEventListener('wheel', onWheel);

				for (const node of nodes) node.material.dispose();
				slice?.geometry.dispose();
				for (const item of shared) item.dispose();

				// Without this the context outlives every visit, and once about sixteen have piled up
				// the browser drops the oldest — every other canvas on the page goes black.
				renderer.dispose();
				canvas.remove();
			}
		};
	}
</script>

<div class={cn('relative overflow-hidden rounded-md border bg-card', className)}>
	<div bind:this={host} class="h-full w-full"></div>

	{#if failed}
		<div
			class="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-muted-foreground"
		>
			{unavailable}
		</div>
	{/if}

	{#if hovered}
		<div
			class="pointer-events-none absolute top-2 left-2 flex items-center gap-2 rounded-md border bg-popover/90 px-2.5 py-1.5 text-xs text-popover-foreground shadow-md"
		>
			<span class="size-4 shrink-0 rounded-sm border" style:background={formatOklch(hovered.colour)}
			></span>
			<span class="font-medium">--{hovered.token}</span>
			<span class="font-mono text-[11px] text-muted-foreground">{hovered.value}</span>
		</div>
	{/if}
</div>
