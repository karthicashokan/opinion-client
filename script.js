const server = 'localhost:3001';
let USERS = [];
let USER = [];
let COMMENTS = [];
let REPLYING_TO_COMMENT = null;
const commentBox = document.getElementById('comment-box');
const commentList = document.getElementById('comment-list');
const commentText = document.getElementById('comment-text');
const commentItemTemplate = document.getElementById('comment-item-template');
const getCommentID = (id) => `comment-item-${id}`;
const commentsDefaultPlaceholder = 'What are your thoughts?';

/**
 * POST Request
 * @param relativeUrl
 * @param data
 * @returns {Promise<any>}
 * @constructor
 */
async function POST(relativeUrl = '', data = {}) {
    const url = `http://${server}/${relativeUrl}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data) // body data type must match "Content-Type" header
    });
    return response.json();
}

/**
 * GET Request
 * @param relativeUrl
 * @param queries
 * @returns {Promise<any>}
 * @constructor
 */
async function GET(relativeUrl = '', queries = {}) {
    const url = `http://${server}/${relativeUrl}?` + new URLSearchParams(queries);
    const response = await fetch(url, {
        method: 'GET'
    });
    return response.json();
}

/**
 * Initializes state
 *      Sets current user
 *      Fetches comments
 * @returns {Promise<void>}
 */
async function init() {
    // Step 1: Fetch users
    USERS = await GET('getUsers');
    // Step 2a: Randomize and set one of the users as current user
    USER = USERS[(Math.random() * USERS.length) | 0];
    console.log('Current user is', USER);
    // Step 2b: Init current user;
    commentBox.querySelector('.user-icon').src = USER.photoUrl;
    // Step 3: Fetch comments
    COMMENTS = await GET('getComments');
}

/**
 * Lists all the existing comments in the discussion
 */
function listAllComments() {
    COMMENTS.forEach((comment) => {
        renderComment(comment);
    })
}

/**
 * Inserts a HTML Node for comment
 * @param comment
 * @param insertAtEnd
 */
function renderComment(comment, insertAtEnd = true) {
    // Step 1: Iterate over comments and get props
    const { id, userId, text, date, voteCount } = comment;
    // Step 2: Find the user who wrote this comment
    const { name, photoUrl } = USERS.filter(user => user.id === userId)[0];
    // Step 3: Create a node from commentItemTemplate
    const commentItem = commentItemTemplate.content.cloneNode(true);
    // Step 4: Set comment props
    commentItem.querySelector('.comment-item').id = getCommentID(id);
    commentItem.querySelector('.user-icon').src = photoUrl;
    commentItem.querySelector('.name').innerHTML = name;
    commentItem.querySelector('.date-time').innerHTML = date;
    commentItem.querySelector('.comment-text').innerHTML = text;
    commentItem.querySelector('.vote-count').innerHTML = voteCount > 0 ? `(${voteCount})` : null;
    commentItem.querySelector('.upvote').onclick = (e) => { upvote(id) };
    commentItem.querySelector('.reply').onclick = (e) => { reply(id) };
    // Step 5: Insert comment
    if (insertAtEnd) {
        commentList.appendChild(commentItem);
    } else {
        commentList.prepend(commentItem);
    }
}

/**
 * Upvote
 * @param commentId
 * @returns {Promise<void>}
 */
async function upvote(commentId) {
    // Step 1: Mark upvote in backend
    const { voteCount } = await POST('upvote', {
        userId: USER.id,
        commentId
    });
    // Step 2: Update value in UI
    const commentElement = document.getElementById(getCommentID(commentId));
    commentElement.querySelector('.vote-count').innerHTML = voteCount > 0 ? `(${voteCount})` : null;
}

async function reply(commentId) {
    // Step 1: Set REPLYING_TO_COMMENT to commentId
    REPLYING_TO_COMMENT = commentId;
    // Step 2: Get comment and user details
    const comment = COMMENTS.find(c => c.id === commentId);
    const user = USERS.find(u => u.id === comment.userId);
    // Step 3: Set placeholder to reflect that the user is replying to a comment
    commentText.placeholder = `Replying to ${user.name}'s comment`
}

/**
 * Add Comment
 * @returns {Promise<void>}
 */
async function addComment () {
    const text = commentText.value;
    // Step 1: Make sure text is valid
    if (!text || text.length === 0) {
        return;
    }
    // Step 2: Store comment in backend
    const comment = await POST('comment', {
        userId: USER.id,
        text,
        parentCommentId: REPLYING_TO_COMMENT || null
    });
    // Step 3: Set date correctly
    comment.date = 'just now';
    // Step 4: Insert comment (at the start)
    renderComment(comment, false);
    // Step 5: Cleanup
    REPLYING_TO_COMMENT = null;
    commentText.value = null;
    commentText.placeholder = commentsDefaultPlaceholder;
}

(async () => {
    await init();
    listAllComments();
})();