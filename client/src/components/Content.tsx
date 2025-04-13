import {
    Heart,
    MessageCircle,
    Share2,
    Bookmark,
    MoreHorizontal,
} from 'lucide-react'
import { useRef } from 'react'

// Sample post data
const posts = [
    {
        id: 1,
        user: { name: 'John Doe', initials: 'JD' },
        timeAgo: '2 minutes ago',
        image: 'https://images.unsplash.com/photo-1743126642334-ab003ce665da?q=80&w=1965&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        likes: 24,
        comments: 12,
        text: 'Just started using this new app called EverStory! The UI is clean and modern, loving it so far.',
    },
    {
        id: 2,
        user: { name: 'Emma Wilson', initials: 'EW' },
        timeAgo: '3 hours ago',
        image: 'https://images.unsplash.com/photo-1555212697-194d092e3b8f?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.0.3',
        likes: 156,
        comments: 42,
        text: 'Been working on my data visualization project all week. The results are finally coming together! #datascience #visualization',
    },
    {
        id: 3,
        user: { name: 'Alex Chen', initials: 'AC' },
        timeAgo: '1 day ago',
        image: 'https://images.unsplash.com/photo-1579403124614-197f69d8187b?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.0.3',
        likes: 87,
        comments: 15,
        text: "Check out this AI model I've been training. It can now generate realistic 3D objects from text descriptions. Pretty wild stuff!",
    },
    {
        id: 4,
        user: { name: 'Sophia Kim', initials: 'SK' },
        timeAgo: '2 days ago',
        image: 'https://images.unsplash.com/photo-1543269664-56d93c1b41a6?q=80&w=1970&auto=format&fit=crop&ixlib=rb-4.0.3',
        likes: 213,
        comments: 31,
        text: 'My new home office setup is finally complete! Coding has never felt more comfortable. Loving the productivity boost from having the right environment.',
    },
    {
        id: 5,
        user: { name: 'Marcus Johnson', initials: 'MJ' },
        timeAgo: '3 days ago',
        image: 'https://images.unsplash.com/photo-1581090700227-1e37b190418e?q=80&w=1970&auto=format&fit=crop&ixlib=rb-4.0.3',
        likes: 67,
        comments: 9,
        text: 'This new quantum computing article blew my mind! The potential applications are endless. Who else is excited about the future of tech? 🚀',
    },
    {
        id: 6,
        user: { name: 'Priya Patel', initials: 'PP' },
        timeAgo: '4 days ago',
        image: 'https://images.unsplash.com/photo-1537432376769-00f5c2f4c8d2?q=80&w=1925&auto=format&fit=crop&ixlib=rb-4.0.3',
        likes: 198,
        comments: 27,
        text: 'Just published my research on advanced machine learning techniques for natural language processing. Link to the paper in bio!',
    },
    {
        id: 7,
        user: { name: 'David Lee', initials: 'DL' },
        timeAgo: '1 week ago',
        image: 'https://images.unsplash.com/photo-1591267990532-e5bdb1b0ceb8?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3',
        likes: 132,
        comments: 18,
        text: "Attended the EverStory conference yesterday. Met so many brilliant minds and learned tons of new techniques. Can't wait to apply them to my projects!",
    },
    {
        id: 8,
        user: { name: 'Olivia Brown', initials: 'OB' },
        timeAgo: '1 week ago',
        image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=2072&auto=format&fit=crop&ixlib=rb-4.0.3',
        likes: 201,
        comments: 34,
        text: "Just completed my 30-day coding challenge! Built a fully functional data analytics dashboard from scratch. So proud of how far I've come! #codingchallenge",
    },
    {
        id: 9,
        user: { name: 'James Wilson', initials: 'JW' },
        timeAgo: '1 week ago',
        image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3',
        likes: 89,
        comments: 13,
        text: 'Looking at the future of AI and data science. These trends are going to reshape how we think about technology in the next decade.',
    },
    {
        id: 10,
        user: { name: 'Mia Rodriguez', initials: 'MR' },
        timeAgo: '2 weeks ago',
        image: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?q=80&w=2020&auto=format&fit=crop&ixlib=rb-4.0.3',
        likes: 156,
        comments: 22,
        text: 'My new data visualization dashboard is finally live! Check out how it transforms complex datasets into intuitive visual stories.',
    },
]

export default function Content() {
    const masonryRef = useRef<HTMLDivElement>(null)

    return (
        <div>
            {/* Story circles at top */}
            <div className="mb-10 flex space-x-4 overflow-x-auto">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex flex-col items-center">
                        <div
                            className={`h-16 w-16 rounded-full bg-white p-[1px]`}
                        >
                            <div className="h-full w-full rounded-full bg-white p-[2px] dark:bg-black">
                                <div className="bg-neutral-light dark:bg-neutral-dark h-full w-full overflow-hidden rounded-full">
                                    {i === 0 ? (
                                        <div className="from-primary to-secondary flex h-full w-full items-center justify-center bg-gradient-to-br text-lg font-bold text-white">
                                            +
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                        <span className="mt-1 text-xs">
                            {i === 0 ? 'Add Story' : `User ${i}`}
                        </span>
                    </div>
                ))}
            </div>

            {/* Pinterest-style masonry layout */}
            <div
                ref={masonryRef}
                className="columns-1 gap-4 space-y-6 sm:columns-3"
            >
                {posts.map((post) => (
                    <div
                        key={post.id}
                        className="border-border-light dark:border-border-dark inline-block w-full break-inside-avoid overflow-hidden rounded-4xl border bg-white dark:bg-black"
                    >
                        <div className="flex items-center justify-between p-4">
                            <div className="flex items-center">
                                <div className="from-primary to-secondary flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br">
                                    <span className="font-bold text-white">
                                        {post.user.initials}
                                    </span>
                                </div>
                                <div className="ml-3">
                                    <p className="text-neutral-dark text-sm font-medium dark:text-white">
                                        {post.user.name}
                                    </p>
                                    <p className="text-neutral-medium text-xs">
                                        {post.timeAgo}
                                    </p>
                                </div>
                            </div>
                            <button className="text-neutral-medium hover:bg-neutral-light hover:text-neutral-dark dark:hover:bg-neutral-dark rounded-full p-2 dark:hover:text-white">
                                <MoreHorizontal size={20} />
                            </button>
                        </div>
                        <div className="overflow-hidden rounded-3xl">
                            <img
                                src={post.image}
                                alt="Post content"
                                className="w-full object-cover"
                                loading="lazy"
                            />
                        </div>
                        <div className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex space-x-4">
                                    <button className="text-neutral-medium hover:text-primary dark:hover:text-primary-light flex items-center gap-1 transition-colors">
                                        <Heart size={20} />
                                        <span className="text-sm font-medium">
                                            {post.likes}
                                        </span>
                                    </button>
                                    <button className="text-neutral-medium hover:text-primary dark:hover:text-primary-light flex items-center gap-1 transition-colors">
                                        <MessageCircle size={20} />
                                        <span className="text-sm font-medium">
                                            {post.comments}
                                        </span>
                                    </button>
                                    <button className="text-neutral-medium hover:text-primary dark:hover:text-primary-light transition-colors">
                                        <Share2 size={20} />
                                    </button>
                                </div>
                                <button className="text-neutral-medium hover:text-primary dark:hover:text-primary-light transition-colors">
                                    <Bookmark size={20} />
                                </button>
                            </div>
                            <p className="text-neutral-dark dark:text-neutral-medium pt-4 text-sm">
                                {post.text}
                            </p>

                            {/* Comments section (collapsed by default) */}
                            {post.comments > 0 && (
                                <div className="border-border-light dark:border-border-dark mt-3 border-t pt-3">
                                    <button className="text-neutral-medium hover:text-primary dark:hover:text-primary-light text-xs">
                                        View all {post.comments} comments
                                    </button>

                                    {/* Sample comment */}
                                    <div className="mt-2 flex items-start">
                                        <div className="bg-neutral-light dark:bg-neutral-dark mr-2 h-6 w-6 flex-shrink-0 overflow-hidden rounded-full">
                                            <div className="flex h-full w-full items-center justify-center text-[10px] font-medium">
                                                {post.id % 2 === 0
                                                    ? 'SK'
                                                    : 'AC'}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs">
                                                <span className="text-neutral-dark font-medium dark:text-white">
                                                    {post.id % 2 === 0
                                                        ? 'Sophia Kim'
                                                        : 'Alex Chen'}
                                                </span>
                                                <span className="text-neutral-medium">
                                                    {' '}
                                                    {post.id % 2 === 0
                                                        ? 'Amazing work! Love how you approached this.'
                                                        : 'This is so cool! Would love to know more about your process.'}
                                                </span>
                                            </p>
                                            <p className="text-neutral-medium mt-1 text-[10px]">
                                                23m
                                            </p>
                                        </div>
                                    </div>

                                    {/* Comment input */}
                                    <div className="mt-3 flex items-center">
                                        <input
                                            type="text"
                                            placeholder="Add a comment..."
                                            className="text-neutral-dark dark:text-neutral-medium w-full bg-transparent text-xs outline-none"
                                        />
                                        <button className="text-primary dark:text-primary-light ml-2 text-xs font-medium">
                                            Post
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
